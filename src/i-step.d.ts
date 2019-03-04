
export interface IStep {
  with?: string|string[];
  from?: string;
  to?: string;
  internally?: string;
  because?: string;
  will?: string;
  withJson?: object;
  if?: string;
  viaUrl?: string;
}