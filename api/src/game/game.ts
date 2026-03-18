export type PlayerChoice = "pierre" | "feuille" | "ciseaux";
export type Winner = "player1" | "player2" | "egalite";
export type GameStatus = "in_progress" | "finished";
export type RoundStatus = "waiting_for_choices" | "resolved";


// Manche du jeu
export type Round = {
  status: RoundStatus; // état de la manche
  startedAt: number; // timestamp de début
  deadlineAt: number; // timestamp limite pour jouer
  player1Choice: PlayerChoice | null; // choix du joueur 1
  player2Choice: PlayerChoice | null; // choix du joueur 2
  winner: Winner | null; // gagnant de la manche
};

// Partie complète
export type Game = {
  score: {
    player1: number;
    player2: number;
  };
  roundsPlayed: number; // nombre de manches jouées
  minimumRounds: number; // minimum avant de pouvoir finir
  status: GameStatus;
  winner: Winner | null; // gagnant final
  roundDurationMs: number; // durée max d'une manche
  currentRound: Round | null; // manche en cours
};


const DEFAULT_MINIMUM_ROUNDS = 4;
const DEFAULT_ROUND_DURATION_MS = 20_000;

export function getWinner(
  player1Choice: PlayerChoice,
  player2Choice: PlayerChoice
): Winner {
  if (player1Choice === player2Choice) return "egalite";

  if (player1Choice === "pierre" && player2Choice === "ciseaux") return "player1";
  if (player1Choice === "ciseaux" && player2Choice === "feuille") return "player1";
  if (player1Choice === "feuille" && player2Choice === "pierre") return "player1";

  return "player2";
}

export function createGame(
  minimumRounds = DEFAULT_MINIMUM_ROUNDS,
  roundDurationMs = DEFAULT_ROUND_DURATION_MS
): Game {
  if (minimumRounds < 1) {
    throw new Error("Le nombre minimum de manches doit être supérieur à 0");
  }

  if (roundDurationMs < 1) {
    throw new Error("La durée d'une manche doit être supérieure à 0");
  }

  return {
    score: {
      player1: 0,
      player2: 0,
    },
    roundsPlayed: 0,
    minimumRounds,
    status: "in_progress",
    winner: null,
    roundDurationMs,
    currentRound: null,
  };
}

export function startRound(game: Game, now: number): void {
  if (game.status === "finished") {
    throw new Error("La partie est déjà terminée");
  }

  if (game.currentRound && game.currentRound.status !== "resolved") {
    throw new Error("Une manche est déjà en cours");
  }

  game.currentRound = {
    status: "waiting_for_choices",
    startedAt: now,
    deadlineAt: now + game.roundDurationMs,
    player1Choice: null,
    player2Choice: null,
    winner: null,
  };
}

export function submitChoice(
  game: Game,
  player: "player1" | "player2",
  choice: PlayerChoice
): void {
  if (game.status === "finished") {
    throw new Error("La partie est déjà terminée");
  }

  if (!game.currentRound) {
    throw new Error("Aucune manche en cours");
  }

  if (game.currentRound.status === "resolved") {
    throw new Error("La manche est déjà résolue");
  }

  if (player === "player1") {
    if (game.currentRound.player1Choice !== null) {
      throw new Error("Le joueur 1 a déjà joué");
    }
    game.currentRound.player1Choice = choice;
    return;
  }

  if (game.currentRound.player2Choice !== null) {
    throw new Error("Le joueur 2 a déjà joué");
  }

  game.currentRound.player2Choice = choice;
}

export function canResolveRound(game: Game, now: number): boolean {
  if (!game.currentRound) return false;
  if (game.currentRound.status === "resolved") return false;

  const bothPlayersAnswered =
    game.currentRound.player1Choice !== null &&
    game.currentRound.player2Choice !== null;

  const timeoutReached = now >= game.currentRound.deadlineAt;

  return bothPlayersAnswered || timeoutReached;
}

export function resolveRound(game: Game, now: number): Winner {
  if (game.status === "finished") {
    throw new Error("La partie est déjà terminée");
  }

  if (!game.currentRound) {
    throw new Error("Aucune manche en cours");
  }

  if (game.currentRound.status === "resolved") {
    throw new Error("La manche est déjà résolue");
  }

  if (!canResolveRound(game, now)) {
    throw new Error("La manche ne peut pas encore être résolue");
  }

  const { player1Choice, player2Choice } = game.currentRound;

  let roundWinner: Winner;

  if (player1Choice !== null && player2Choice !== null) {
    roundWinner = getWinner(player1Choice, player2Choice);
  } else if (player1Choice !== null && player2Choice === null) {
    roundWinner = "player1";
  } else if (player1Choice === null && player2Choice !== null) {
    roundWinner = "player2";
  } else {
    roundWinner = "egalite";
  }

  applyRoundResult(game, roundWinner);

  game.currentRound.winner = roundWinner;
  game.currentRound.status = "resolved";

  return roundWinner;
}

function applyRoundResult(game: Game, roundWinner: Winner): void {
  game.roundsPlayed++;

  if (roundWinner === "player1") {
    game.score.player1++;
  }

  if (roundWinner === "player2") {
    game.score.player2++;
  }

  if (shouldFinishGame(game)) {
    game.status = "finished";
    game.winner =
      game.score.player1 > game.score.player2 ? "player1" : "player2";
  }
}

export function shouldFinishGame(game: Game): boolean {
  if (game.roundsPlayed < game.minimumRounds) {
    return false;
  }

  return game.score.player1 !== game.score.player2;
}

export function isGameFinished(game: Game): boolean {
  return game.status === "finished";
}