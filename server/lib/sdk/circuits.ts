import { HttpClient } from "./http";
import type {
  Circuit,
  CircuitSummary,
  CircuitView,
  CreateCircuitInput,
  UpdateCircuitInput,
} from "./types";

/** Типізований клієнт до API схем. */
export class CircuitApi extends HttpClient {
  list(): Promise<CircuitSummary[]> {
    return this.request<CircuitSummary[]>("/api/circuits");
  }

  get(id: string): Promise<CircuitView> {
    return this.request<CircuitView>(`/api/circuits/${id}`);
  }

  create(input: CreateCircuitInput): Promise<Circuit> {
    return this.request<Circuit>("/api/circuits", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  update(id: string, input: UpdateCircuitInput): Promise<Circuit> {
    return this.request<Circuit>(`/api/circuits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  remove(id: string): Promise<void> {
    return this.request<void>(`/api/circuits/${id}`, { method: "DELETE" });
  }
}
