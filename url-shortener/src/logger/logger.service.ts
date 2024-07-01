import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: ELASTICSEARCH_URL,
  },
  indexPrefix: 'logstash',
  bufferLimit: 100,
  source: 'source',
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

esTransport.on('error', (error) => {
  console.error('Elasticsearch Transport Error:', error);
});

export const loggerOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike(),
      ),
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    esTransport,
  ],
};

export const LoggerModule = WinstonModule.forRoot(loggerOptions);
