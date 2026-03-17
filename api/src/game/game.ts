// a = pierre
// b = ciseaux
// c = feuille

// Test red 
// export function getWinner(p1: string, p2: string): string {
//   return 'draw'
// }

// Test true
export type PlayerChoice = "pierre" | "feuille" | "ciseaux";
export type Winner = "player1" | "player2" | "draw";

export function getWinner(
  player1Choice: PlayerChoice,
  player2Choice: PlayerChoice
): Winner {
  if (player1Choice === player2Choice) return "draw";

  if (player1Choice === "pierre" && player2Choice === "ciseaux") return "player1";
  if (player1Choice === "ciseaux" && player2Choice === "feuille") return "player1";
  if (player1Choice === "feuille" && player2Choice === "pierre") return "player1";

  return "player2";
}

