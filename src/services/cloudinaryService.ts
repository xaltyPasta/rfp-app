// src/services/cloudinaryService.ts
import "server-only";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

/**
 * Minimal shape of what we care about from Cloudinary.
 */
export type CloudinaryUploadResult = {
    url: string;
    publicId: string;
};

/**
 * Upload a remote file (by URL) to Cloudinary using an UNSIGNED upload preset.
 *
 * - `fileUrl` can be the Resend `download_url` for an attachment.
 * - `folder` is optional but nice to keep things organized ("rfp-app/proposals").
 */
export async function uploadRemoteFileToCloudinary(params: {
    fileUrl: string;
    filename?: string;
    folder?: string;
}): Promise<CloudinaryUploadResult | null> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        console.error(
            "Cloudinary env missing: CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET"
        );
        return null;
    }

    const { fileUrl, filename, folder } = params;

    try {
        const formData = new FormData();
        formData.set("file", fileUrl); // Cloudinary will fetch this URL
        formData.set("upload_preset", UPLOAD_PRESET);

        if (folder) {
            formData.set("folder", folder);
        }
        if (filename) {
            // This is a hint; Cloudinary may adjust it
            formData.set("public_id", filename.replace(/\.[^/.]+$/, "")); // remove extension
        }

        const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

        const res = await fetch(endpoint, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Cloudinary upload failed:", res.status, errText);
            return null;
        }

        const data = (await res.json()) as {
            secure_url?: string;
            public_id?: string;
            url?: string;
            [key: string]: any;
        };

        if (!data.secure_url || !data.public_id) {
            console.error("Cloudinary upload missing secure_url/public_id:", data);
            return null;
        }

        return {
            url: data.secure_url,
            publicId: data.public_id,
        };
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        return null;
    }
}
