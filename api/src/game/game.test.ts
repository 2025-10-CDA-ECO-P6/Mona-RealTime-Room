import { describe, it, expect } from "vitest";
import { getWinner } from "./game";

// a = pierre
// b = ciseaux
// c = feuille


describe('getWinner', () => {
  it('retourne le joueur 1 quand il gagne', () => {
    expect(getWinner("pierre", "ciseaux")).toBe("player1")
  })
})