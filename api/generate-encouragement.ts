import { handleGenerateEncouragementRequest } from '../backend/encouragementHandler';

export default async function handler(req: Request): Promise<Response> {
  return handleGenerateEncouragementRequest(req);
}
