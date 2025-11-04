import dotenv from "dotenv";
dotenv.config();

export const getOffers = async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.KEITARO_HOST}/offers`,
      {
        headers: {
          "Api-Key": process.env.KEITARO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return res
        .status(400)
        .json({ msg: "Ошибка при получении списка офферов" });
    }
    const offers = await response.json();
    return res.status(200).json(offers);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ msg: "Ошибка при получении списка офферов" });
  }
};
