export interface AnswerRailOptions {
  edgeUrl?: string;
  rfc9110?: boolean;
  tokenBudget?: number;
  origin?: string;
  apiKey?: string;
  tenantDomain?: string;
  bypass?: boolean;
}

export declare function isAiCrawler(request: Request): boolean;
export declare function answerRail(options?: AnswerRailOptions): (request: Request) => Promise<Response | undefined>;
export declare const answerRailMiddleware: typeof answerRail;
export default answerRail;
