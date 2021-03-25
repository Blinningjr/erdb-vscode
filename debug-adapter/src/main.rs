use std::io::prelude::*;
use std::net::{
    TcpListener,
    TcpStream,
    SocketAddr,
};

use structopt::StructOpt;

use anyhow::{
    anyhow,
    Result,
};

use log::{
    debug,
    error,
    info,
    trace,
};

use simplelog::*;

use debugserver_types::{
    ProtocolMessage,
    Response,
    Request,
};

use std::io;
use std::io::{BufRead, BufReader};
use std::io::{Read, Write};




#[derive(Debug, StructOpt)]
#[structopt(name = "debug-adapter", about = "My debug-adapter.")]
struct Opt {
    /// Set port
    #[structopt(short = "p", long = "port", default_value = "8800")]
    port: u16,
    
    /// Set log filter
    #[structopt(short = "v", long = "verbosity", default_value = "Off")]
    verbosity: LevelFilter,
}


fn main() -> Result<(), anyhow::Error> {
    let opt = Opt::from_args();

    // Setup log
    let cfg = ConfigBuilder::new().build();
    let log_level = opt.verbosity;
    let _ = TermLogger::init(log_level, cfg, TerminalMode::Mixed);

    start_server(opt.port)
}


fn start_server(port: u16) -> Result<(), anyhow::Error> {
    info!("Starting debug-adapter server on port: {}", port);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = TcpListener::bind(addr)?;

    let (socket, addr) = listener.accept()?;
    info!("Accepted connection from {}", addr);

    let reader = socket.try_clone()?;
    let writer = socket;

    println!("{:#?}", handle_connection(BufReader::new(reader)));

    Ok(())
}


fn handle_connection<R: Read>(mut stream: BufReader<R>) -> Result<DebugAdapterMessage, anyhow::Error> {
    let mut header = String::new();

    stream.read_line(&mut header)?;
    trace!("< {}", header.trim_end());

    // we should read an empty line here
    let mut buff = String::new();
    stream.read_line(&mut buff)?;

    let len = get_content_len(&header)
        .ok_or_else(|| anyhow!("Failed to read content length from header '{}'", header))?;

    let mut content = vec![0u8; len];
    let bytes_read = stream.read(&mut content)?;

//    assert!(bytes_read == len);

    // Extract protocol message
    let protocol_message: ProtocolMessage = serde_json::from_slice(&content)?;
    println!("{:#?}", protocol_message);

    match protocol_message.type_.as_ref() {
        "request" => Ok(DebugAdapterMessage::Request(serde_json::from_slice(
            &content,
        )?)),
        "response" => Ok(DebugAdapterMessage::Response(serde_json::from_slice(
            &content,
        )?)),
        "event" => Ok(DebugAdapterMessage::Event(serde_json::from_slice(
            &content,
        )?)),
        other => Err(anyhow!("Unknown message type: {}", other)),
    }
}


fn get_content_len(header: &str) -> Option<usize> {
    let mut parts = header.trim_end().split_ascii_whitespace();

    // discard first part
    parts.next()?;

    parts.next()?.parse::<usize>().ok()
}

#[derive(Debug)]
pub enum DebugAdapterMessage {
    Request(Request),
    Response(Response),
    Event(debugserver_types::Event),
}

