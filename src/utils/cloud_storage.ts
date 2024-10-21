import { google } from "googleapis";
import fs from "fs";
import path from "path";
import logger from "./logger";

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(
        __dirname,
        "..",
        "..",
        process.env.GOOGLE_APPLICATION_CREDENTIALS_FILE as string
    ),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
});

export const getFileIDFromWebLink = (link: string) => {
    /* Start and end index of file id from report link */
    const startIndexOfFileId = link.indexOf("/d/") + 3;
    const endIndexOfFileId = link.indexOf("/", startIndexOfFileId);

    return link.substring(startIndexOfFileId, endIndexOfFileId);
};
export const deleteFile = async (fileId: string) => {
    try {
        const drive = google.drive({
            version: "v3",
            auth: auth,
        });

        await drive.files.delete({
            fileId: fileId,
        });
    } catch (error) {
        throw error;
    }
};
export const getAllFiles = async () => {
    const drive = google.drive({
        version: "v3",
        auth: auth,
    });

    const files = await drive.files.list();

    logger.info(`Files In Drive ${JSON.stringify(files.data.files)}`);
};
export const uploadReportFile = async (
    filePath: string,
    fileNameInStorage: string
) => {
    /* Google Drive Reference */
    const drive = google.drive({
        version: "v3",
        auth: auth,
    });

    /* Uploading file to drive */
    const file = await drive.files.create({
        media: {
            body: fs.createReadStream(filePath),
        },
        fields: "id, webViewLink",
        requestBody: {
            name: fileNameInStorage,
            mimeType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });

    /* Granting read permissions to anyone with the link */
    await drive.permissions.create({
        fileId: file.data.id as string,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    /* Returning the link */
    return file.data.webViewLink;
};
