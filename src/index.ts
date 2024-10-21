import dotenv from "dotenv";
dotenv.config();
dotenv.config({
    path: `.env.${process.env.NODE_ENV}`,
});

import app from "./app";
import logger from "./utils/logger";
import { deleteFile, getAllFiles } from "./utils/cloud_storage";


app.listen(process.env.PORT, async () => {
    // await getAllFiles();
    logger.info(`Reports Service Listening On Port ${process.env.PORT}`);
});
