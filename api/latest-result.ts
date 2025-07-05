
import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as cheerio from "cheerio";

interface LottoResult {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

const fetchLatestRoundNumber = async (): Promise<number> => {
  const historyUrl = "https://en.lottolyzer.com/history/south-korea/6_slash_45-lotto/page/1/per-page/50/summary-view";
  const { data: html } = await axios.get(historyUrl);
  const $ = cheerio.load(html);

  const firstRowRoundText = $("table tbody tr").first().find("td").eq(0).text();
  const round = parseInt(firstRowRoundText.trim());

  if (isNaN(round)) {
    throw new Error("Could not extract latest round number");
  }

  return round;
};

const fetchLottoDraw = async (round: number): Promise<LottoResult | null> => {
  const url = `https://en.lottolyzer.com/home/south-korea/6_slash_45-lotto/number-view/draw/${round}`;

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const numberImgs = $(".lotto-balls img");
    const numbers: number[] = [];

    numberImgs.each((i, el) => {
      const alt = $(el).attr("alt");
      if (alt && !isNaN(Number(alt))) {
        numbers.push(Number(alt));
      }
    });

    if (numbers.length < 7) throw new Error("Failed to parse all numbers");

    const mainNumbers = numbers.slice(0, 6);
    const bonus = numbers[6];

    const dateText = $(".lotto-number-info")
      .text()
      .match(/(\d{4}\.\d{2}\.\d{2})/);
    const date = dateText ? dateText[1].replace(/\./g, "-") : "";

    return {
      round,
      date,
      numbers: mainNumbers,
      bonus,
    };
  } catch (error) {
    console.error("Error fetching lotto draw:", error);
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const round = await fetchLatestRoundNumber();
    const result = await fetchLottoDraw(round);

    if (!result) {
      return res.status(500).json({ error: "Failed to fetch lotto result" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching the result." });
  }
}
