import "server-only";

import { Mastra } from "@mastra/core";
import { productSummaryAgent } from "./agents/product-summary-agent";

/** Instância única da Mastra com os agentes internos do projeto. */
export const mastra = new Mastra({
  agents: { productSummaryAgent },
});
