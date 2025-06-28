import { streamUI } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const searchFlights = async (
  source: string,
  destination: string,
  date: string
) => {
  return [
    {
      id: "1",
      flightNumber: "AA123",
    },
    {
      id: "2",
      flightNumber: "AA456",
    },
  ];
};

const lookupFlight = async (flightNumber: string) => {
  return {
    flightNumber: flightNumber,
    departureTime: "10:00 AM",
    arrivalTime: "12:00 PM",
  };
};

export async function submitUserMessage(input: string) {
  "use server";

  const ui = await streamUI({
    model: openai("gpt-4o"),
    system: "you are a flight booking assistant",
    prompt: input,
    text: async ({ content }) => <div>{content}</div>,
    tools: {
      searchFlights: {
        description: "search for flights",
        parameters: z.object({
          source: z.string().describe("The origin of the flight"),
          destination: z.string().describe("The destination of the flight"),
          date: z.string().describe("The date of the flight"),
        }),
        generate: async function* ({ source, destination, date }) {
          yield `Searching for flights from ${source} to ${destination} on ${date}...`;
          const results = await searchFlights(source, destination, date);
          return <Flights flights={results} />;
        },
      },
      lookupFlight: {
        description: "lookup details for a flight",
        parameters: z.object({
          flightNumber: z.string().describe("The flight number"),
        }),
        generate: async function* ({ flightNumber }) {
          yield `Looking up details for flight ${flightNumber}...`;
          const details = await lookupFlight(flightNumber);

          return (
            <div>
              <div>Flight Number: {details.flightNumber}</div>
              <div>Departure Time: {details.departureTime}</div>
              <div>Arrival Time: {details.arrivalTime}</div>
            </div>
          );
        },
      },
    },
  });

  return ui.value;
}
