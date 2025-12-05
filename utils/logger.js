import winston from "winston";
import LokiTransport from "winston-loki";
import path from "path";
import fs from "fs";
const logsDir = "./logs";
const absolute = path.resolve(logsDir);
console.log('Logs directory absolute path:', absolute);

async function ensureLogsDirectoryExists() {
  try {
    await fs.promises.access(logsDir, fs.constants.F_OK);
    console.log(`Logs directory already exists at: ${absolute}`);
  } catch (err) {
    try {
      await fs.promises.mkdir(logsDir, { recursive: true });
      console.log(`Logs directory created at: ${absolute}`);
    } catch (mkdirErr) {
      console.error(`Failed to create logs directory at: ${absolute}`, mkdirErr);
    }
  }
}
async function untestforlogfiles() {
  try {
    const fileslist =['app.log','error.log','exceptions.log','rejections.log'];
    const files = await fs.promises.readdir(logsDir); 
    for( let file of fileslist){
      if(!files.includes(file)){
        console.warn(`Warning: Expected log file "${file}" is missing in ${absolute}`);
      }
    }
    // console.log('Log files in directory:', files);
  } catch (error) {
    console.error('Error reading log files:', error);
  }
}

ensureLogsDirectoryExists();
untestforlogfiles();
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};
const colours = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  verbose: "cyan",
  debug: "blue",
  silly: "grey"
};


// this gives the format reference for the logger to how to fill the logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

//this give sthe format reference for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }), // Enable colors for all parts
  winston.format.printf(({ timestamp, level, message, stack, service }) => {
    // Custom format that preserves colors
    return `${timestamp} [${service}] ${level}: ${stack || message}`;
  })
);


const logger = winston.createLogger({
  level: "silly", // this will set the minimum level to log example if silly is set everything will be logged
  levels: levels,//pass the levlels object to the logger
   defaultMeta: { 
    service: 'login-app',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport with colors - FORCE COLOR OUTPUT
    new winston.transports.Console({
      format: consoleFormat,
      level: 'silly',
      handleExceptions: true,
      // Force colors even if terminal detection fails
      stderrLevels: ['error'],
      consoleWarnLevels: ['warn'],
      forceConsole: true
    }),
    
    // File transport for all logs (no colors in files)
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      format: fileFormat,
      level: 'silly',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
],

    exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat
    })
  ]




});


export default logger;