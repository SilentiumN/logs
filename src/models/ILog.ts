export interface ILog {
  Timestamp: string;
  Level: 'FATAL' | 'ERROR' | 'DEBUG' | 'INFO' | 'TRACE';
  Message: string;
  Source: string;
}
