import { useEffect, useState } from "react";
import axios from "axios";

const AudioPlayer = ({ s3Key }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                if (!s3Key) {
                    console.warn("No s3Key provided to AudioPlayer");
                    return;
                }

                // Decode any URI-encoded key (if passed from the frontend)
                let key = decodeURIComponent(s3Key);

                // Clean redundant prefixes
                key = key.replace(/^audio\//, "");
                key = key.replace(/^student-speaking\//, "");

                // If it’s a full S3 URL, extract only the filename part
                if (key.startsWith("http")) {
                    key = key.split("/").pop();
                }

                // Encode again before sending to backend (so slashes don’t break Express)
                const safeKey = encodeURIComponent(s3Key);

                console.log("Resolved key to request:", safeKey);

                const res = await axios.get(`http://localhost:5000/api/tests/audio-url/${safeKey}`);

                if (res.data?.url) {
                    setUrl(res.data.url);
                } else {
                    console.warn("No signed URL returned from backend");
                }
            } catch (err) {
                console.error("Failed to load audio:", err.response?.data || err.message);
            }
        };

        fetchUrl();
    }, [s3Key]);

    if (!url) return <p>Loading audio...</p>;

    return (
        <audio
            controls
            src={url}
            style={{ marginBottom: 12, width: "100%" }}
        />
    );
};

export default AudioPlayer;
