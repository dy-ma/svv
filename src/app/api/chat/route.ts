import { openai } from '@ai-sdk/openai';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool
} from 'ai';
import { z } from "zod"

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
    system:
      'You are Livia, an experienced and empathetic travel insurance claims agent, specializing in non-medical claims. Your role is to assist policyholders who have experienced trip issues such as cancellations, delays, lost baggage, theft, or travel disruptions.' +
      'Always be professional, concise, and compassionate. Your responsibilities include: ' +
      'Asking for relevant claim information (e.g., trip dates, incident details, receipts).' +
      'Asking for relevant customer information (e.g., their name, policy number)' +
      'Customers have their policies in the form of documents. Ask for their policy document.' +
      'Explaining what documentation is needed (e.g., airline receipts, police reports).' +
      'Clarifying what is and isn\'t covered under the policy in simple, friendly terms.' +
      'Escalating or deferring cases where necessary, without making assumptions.' +
      'Never offer legal or medical advice.' +
      'When in doubt, politely inform the user that the claim may need to be reviewed by a human claims adjuster.' +
      'When you feel like you\'ve gathered all the information you can, submit the claim for review.' +
      'Format responses conversationally, as if speaking with the policyholder directly. Use plain language, avoid insurance jargon, and keep a calm and reassuring tone throughout.`',
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: 'Convert a temperature in fahrenheit to celsius',
        inputSchema: z.object({
          temperature: z
            .number()
            .describe('The temperature in fahrenheit to convert'),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return {
            celsius,
          };
        },
      }),
      verifyCustomer: tool({
        description: 'Check if a person is a valid customer based on their name and policy number.',
        inputSchema: z.object({
          name: z.string().describe('Full name of the customer'),
          policyNumber: z.string().describe('Customer\'s travel insurance policy number'),
        }),
        execute: async ({ name, policyNumber }) => {
          // In a real implementation, this would query a customer database
          console.log(`Verifying customer: ${name}, Policy #: ${policyNumber}`);

          // Fake implementation: assume all policy numbers starting with 'ZR' are valid
          const isValid = policyNumber.startsWith('ZR');

          return {
            isValidCustomer: isValid,
            name,
            policyNumber,
          };
        },
      }),
      reviewClaim: tool({
        description: 'Submit a structured claim review including decision, suggested payout, and reasoning',
        inputSchema: z.object({
          recommendation: z.enum(['approve', 'deny', 'escalate']).describe('Recommended action on this claim'),
          suggestedPayoutUSD: z
            .number()
            .min(0)
            .optional()
            .describe('Suggested payout amount in USD, if the claim is approved'),
          reasoning: z.string().describe('Summary of evidence and justification for the recommendation'),
          redFlags: z.array(z.string().describe('List of potential issues, inconsistencies, or missing information'))
        }),
        execute: async ({ recommendation, suggestedPayoutUSD, reasoning, redFlags }) => {
          // Make some API Request here
          return {
            recommendation,
            suggestedPayoutUSD,
            reasoning,
            redFlags,
            submittedAt: new Date().toISOString(),
          };
        }
      }),
      convertCurrency: tool({
        description: 'Convert an amount from one currency to another using live exchange rates.',
        inputSchema: z.object({
          baseCurrency: z.string().describe('The 3-letter ISO currency code to convert from, e.g., "EUR"'),
          targetCurrency: z.string().describe('The 3-letter ISO currency code to convert to, e.g., "USD"'),
          amount: z.number().min(0).describe('The amount of money to convert'),
        }),
        execute: async ({ baseCurrency, targetCurrency, amount }) => {
          const res = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_API_KEY}/pair/${baseCurrency}/${targetCurrency}/${amount}`);
          const data = await res.json();

          if (!res.ok || !data?.result) {
            throw new Error('Failed to fetch exchange rate');
          }

          return {
            convertedAmount: data.conversion_result,
            rate: data.conversion_rate,
            date: data.time_last_update_utc,
            baseCurrency,
            targetCurrency,
            originalAmount: amount,
          };
        },
      })
    },
  });

  return result.toUIMessageStreamResponse();
}