import { Request, Response, NextFunction } from 'express';

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log("================================");
  console.log("METHOD:", req.method);
  console.log("URL:", req.protocol + "://" + req.get("host") + req.originalUrl);
  console.log("BODY:", req.body);
  console.log("================================");

  next();
};

export default logger;