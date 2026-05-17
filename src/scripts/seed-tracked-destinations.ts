import "dotenv/config";
import { createTursoClient, createTursoRepository } from "../db/repositories.js";
import { loadEnvironment, getTursoConnectionConfig } from "../config/env.js";

interface SeedTrackedDestinationRow {
  id: string;
  originAirportCode: string;
  destinationAirportCode: string;
  destinationCity?: string;
  destinationCountry?: string;
  tripType: "round_trip" | "one_way";
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  departureDateFrom?: string;
  departureDateTo?: string;
  returnDateFrom?: string;
  returnDateTo?: string;
  maxStops?: number | null;
  currencyCode: string;
  locale: string;
}

// 統一設定預設日期與參數，方便後續修改
const defaultParams = {
  tripType: "round_trip" as const,
  cabinClass: "economy" as const,
  departureDateFrom: "2026-06-01",
  departureDateTo: "2026-06-30",
  returnDateFrom: "2026-06-04",
  returnDateTo: "2026-07-10",
  maxStops: 1,
  currencyCode: "TWD",
  locale: "zh-TW"
};

const seedRows: SeedTrackedDestinationRow[] = [
  // ==========================================
  // 1. 台北/桃園出發 (TPE / TSA)
  // ==========================================
  {
    id: "tpe-nrt-rt-econ",
    originAirportCode: "TPE",
    destinationAirportCode: "NRT",
    destinationCity: "Tokyo",
    destinationCountry: "Japan",
    ...defaultParams
  },
  {
    id: "tpe-kix-rt-econ",
    originAirportCode: "TPE",
    destinationAirportCode: "KIX",
    destinationCity: "Osaka",
    destinationCountry: "Japan",
    ...defaultParams
  },
  {
    id: "tpe-icn-rt-econ",
    originAirportCode: "TPE",
    destinationAirportCode: "ICN",
    destinationCity: "Seoul",
    destinationCountry: "South Korea",
    ...defaultParams
  },
  {
    id: "tpe-bkk-rt-econ",
    originAirportCode: "TPE",
    destinationAirportCode: "BKK",
    destinationCity: "Bangkok",
    destinationCountry: "Thailand",
    ...defaultParams
  },
  {
    id: "tpe-kul-rt-econ",
    originAirportCode: "TPE",
    destinationAirportCode: "KUL",
    destinationCity: "Kuala Lumpur",
    destinationCountry: "Malaysia",
    ...defaultParams
  },
  {
    id: "tpe-sgn-rt-econ",
    originAirportCode: "TPE",
    destinationAirportCode: "SGN",
    destinationCity: "Ho Chi Minh City",
    destinationCountry: "Vietnam",
    ...defaultParams
  },

  // ==========================================
  // 2. 台中出發 (RMQ)
  // ==========================================
  {
    id: "rmq-nrt-rt-econ",
    originAirportCode: "RMQ",
    destinationAirportCode: "NRT",
    destinationCity: "Tokyo",
    destinationCountry: "Japan",
    ...defaultParams
  },
  {
    id: "rmq-icn-rt-econ",
    originAirportCode: "RMQ",
    destinationAirportCode: "ICN",
    destinationCity: "Seoul",
    destinationCountry: "South Korea",
    ...defaultParams
  },
  {
    id: "rmq-sgn-rt-econ",
    originAirportCode: "RMQ",
    destinationAirportCode: "SGN",
    destinationCity: "Ho Chi Minh City",
    destinationCountry: "Vietnam",
    ...defaultParams
  },

  // ==========================================
  // 3. 高雄出發 (KHH)
  // ==========================================
  {
    id: "khh-nrt-rt-econ",
    originAirportCode: "KHH",
    destinationAirportCode: "NRT",
    destinationCity: "Tokyo",
    destinationCountry: "Japan",
    ...defaultParams
  },
  {
    id: "khh-kix-rt-econ",
    originAirportCode: "KHH",
    destinationAirportCode: "KIX",
    destinationCity: "Osaka",
    destinationCountry: "Japan",
    ...defaultParams
  },
  {
    id: "khh-icn-rt-econ",
    originAirportCode: "KHH",
    destinationAirportCode: "ICN",
    destinationCity: "Seoul",
    destinationCountry: "South Korea",
    ...defaultParams
  },
  {
    id: "khh-bkk-rt-econ",
    originAirportCode: "KHH",
    destinationAirportCode: "BKK",
    destinationCity: "Bangkok",
    destinationCountry: "Thailand",
    ...defaultParams
  },
  {
    id: "khh-dad-rt-econ",
    originAirportCode: "KHH",
    destinationAirportCode: "DAD",
    destinationCity: "Da Nang",
    destinationCountry: "Vietnam",
    ...defaultParams
  }
];

async function main(): Promise<void> {
  const env = loadEnvironment();
  const client = createTursoClient(getTursoConnectionConfig(env));
  const repository = createTursoRepository(client);

  for (const row of seedRows) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO tracked_destinations (
          id,
          origin_airport_code,
          destination_airport_code,
          destination_city,
          destination_country,
          trip_type,
          cabin_class,
          departure_date_from,
          departure_date_to,
          return_date_from,
          return_date_to,
          max_stops,
          currency_code,
          locale,
          is_active,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `,
      args: [
        row.id,
        row.originAirportCode,
        row.destinationAirportCode,
        row.destinationCity ?? null,
        row.destinationCountry ?? null,
        row.tripType,
        row.cabinClass,
        row.departureDateFrom ?? null,
        row.departureDateTo ?? null,
        row.returnDateFrom ?? null,
        row.returnDateTo ?? null,
        typeof row.maxStops === "number" ? row.maxStops : null,
        row.currencyCode,
        row.locale
      ]
    });
  }

  const activeDestinations = await repository.listActiveTrackedDestinations();

  console.log(`[seed-tracked-destinations] inserted or updated ${seedRows.length} rows`);
  console.log(`[seed-tracked-destinations] active tracked destinations: ${activeDestinations.length}`);

  for (const destination of activeDestinations) {
    console.log(
      `- ${destination.id}: ${destination.originAirportCode} -> ${destination.destinationAirportCode} (${destination.cabinClass})`
    );
  }

  await client.close();
}

void main().catch((error) => {
  console.error("[seed-tracked-destinations] failed", error);
  process.exitCode = 1;
});
