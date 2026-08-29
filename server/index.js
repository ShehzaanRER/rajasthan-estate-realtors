import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();


const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "React is connected to Express!",
  });
});

app.get("/api/google-reviews", async (req, res) => {
  try {
    const placeId = process.env.GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_API_KEY;

    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "displayName,rating,userRatingCount,formattedAddress",
        },
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: "Unable to fetch Google Business data",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});