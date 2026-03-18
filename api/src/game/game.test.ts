import { describe, it, expect } from "vitest";
import {
  createGame,
  startRound,
  submitChoice,
  resolveRound,
  getWinner,
  canResolveRound,
  isGameFinished,
} from "./game";

describe("getWinner", () => {
  it("retourne egalite en cas d'égalité de choix", () => {
    expect(getWinner("pierre", "pierre")).toBe("egalite");
    expect(getWinner("feuille", "feuille")).toBe("egalite");
    expect(getWinner("ciseaux", "ciseaux")).toBe("egalite");
  });

  it("retourne player1 quand player1 gagne", () => {
    expect(getWinner("pierre", "ciseaux")).toBe("player1");
    expect(getWinner("ciseaux", "feuille")).toBe("player1");
    expect(getWinner("feuille", "pierre")).toBe("player1");
  });

  it("retourne player2 quand player2 gagne", () => {
    expect(getWinner("ciseaux", "pierre")).toBe("player2");
    expect(getWinner("feuille", "ciseaux")).toBe("player2");
    expect(getWinner("pierre", "feuille")).toBe("player2");
  });
});


describe("round management", () => {
  it("démarre une manche avec une deadline à 20 secondes", () => {
    const game = createGame();
    startRound(game, 1000);

    expect(game.currentRound).toEqual({
      status: "waiting_for_choices",
      startedAt: 1000,
      deadlineAt: 21000,
      player1Choice: null,
      player2Choice: null,
      winner: null,
    });
  });

  it("empêche de démarrer une manche si une manche est déjà en cours", () => {
    const game = createGame();
    startRound(game, 1000);

    expect(() => startRound(game, 2000)).toThrow("Une manche est déjà en cours");
  });

  it("permet aux deux joueurs de soumettre leur choix", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");

    expect(game.currentRound?.player1Choice).toBe("pierre");
    expect(game.currentRound?.player2Choice).toBe("ciseaux");
  });

  it("empêche un joueur de jouer deux fois dans la même manche", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");

    expect(() => submitChoice(game, "player1", "feuille")).toThrow(
      "Le joueur 1 a déjà joué"
    );
  });

  it("refuse un choix s'il n'y a pas de manche en cours", () => {
    const game = createGame();

    expect(() => submitChoice(game, "player1", "pierre")).toThrow(
      "Aucune manche en cours"
    );
  });

  it("peut résoudre immédiatement si les deux joueurs ont répondu", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");

    expect(canResolveRound(game, 1500)).toBe(true);
  });

  it("ne peut pas résoudre avant le timeout si un seul joueur a répondu", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");

    expect(canResolveRound(game, 1500)).toBe(false);
  });

  it("peut résoudre au timeout même si un seul joueur a répondu", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");

    expect(canResolveRound(game, 21000)).toBe(true);
  });

  it("donne la manche au joueur 1 si lui seul a répondu avant la fin du temps", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");

    const winner = resolveRound(game, 21000);

    expect(winner).toBe("player1");
    expect(game.score).toEqual({ player1: 1, player2: 0 });
    expect(game.roundsPlayed).toBe(1);
  });

  it("donne la manche au joueur 2 si lui seul a répondu avant la fin du temps", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player2", "feuille");

    const winner = resolveRound(game, 21000);

    expect(winner).toBe("player2");
    expect(game.score).toEqual({ player1: 0, player2: 1 });
    expect(game.roundsPlayed).toBe(1);
  });

  it("retourne egalite si personne ne répond avant la fin du temps", () => {
    const game = createGame();
    startRound(game, 1000);

    const winner = resolveRound(game, 21000);

    expect(winner).toBe("egalite");
    expect(game.score).toEqual({ player1: 0, player2: 0 });
    expect(game.roundsPlayed).toBe(1);
  });

  it("résout normalement la manche si les deux joueurs ont répondu", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");

    const winner = resolveRound(game, 1500);

    expect(winner).toBe("player1");
    expect(game.score).toEqual({ player1: 1, player2: 0 });
    expect(game.roundsPlayed).toBe(1);
    expect(game.currentRound?.status).toBe("resolved");
  });

  it("refuse de résoudre trop tôt", () => {
    const game = createGame();
    startRound(game, 1000);

    submitChoice(game, "player1", "pierre");

    expect(() => resolveRound(game, 5000)).toThrow(
      "La manche ne peut pas encore être résolue"
    );
  });
});

describe("game rules", () => {
  it("ne termine pas la partie avant 4 manches", () => {
    const game = createGame();

    startRound(game, 0);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 1000);

    startRound(game, 30000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 31000);

    startRound(game, 60000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 61000);

    expect(isGameFinished(game)).toBe(false);
    expect(game.status).toBe("in_progress");
    expect(game.winner).toBeNull();
  });

  it("termine la partie après 4 manches si un joueur mène", () => {
    const game = createGame();

    startRound(game, 0);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 1000); // P1

    startRound(game, 30000);
    submitChoice(game, "player1", "ciseaux");
    submitChoice(game, "player2", "pierre");
    resolveRound(game, 31000); // P2

    startRound(game, 60000);
    submitChoice(game, "player1", "feuille");
    submitChoice(game, "player2", "pierre");
    resolveRound(game, 61000); // P1

    startRound(game, 90000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 91000); // P1

    expect(game.roundsPlayed).toBe(4);
    expect(game.score).toEqual({ player1: 3, player2: 1 });
    expect(game.status).toBe("finished");
    expect(game.winner).toBe("player1");
  });

  it("continue après 4 manches en cas d'égalité", () => {
    const game = createGame();

    startRound(game, 0);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 1000); // P1

    startRound(game, 30000);
    submitChoice(game, "player1", "ciseaux");
    submitChoice(game, "player2", "pierre");
    resolveRound(game, 31000); // P2

    startRound(game, 60000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 61000); // P1

    startRound(game, 90000);
    submitChoice(game, "player1", "ciseaux");
    submitChoice(game, "player2", "pierre");
    resolveRound(game, 91000); // P2

    expect(game.roundsPlayed).toBe(4);
    expect(game.score).toEqual({ player1: 2, player2: 2 });
    expect(game.status).toBe("in_progress");
    expect(game.winner).toBeNull();
  });

  it("termine à la manche supplémentaire quand un joueur prend l'avantage", () => {
    const game = createGame();

    startRound(game, 0);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 1000); // P1

    startRound(game, 30000);
    submitChoice(game, "player1", "ciseaux");
    submitChoice(game, "player2", "pierre");
    resolveRound(game, 31000); // P2

    startRound(game, 60000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 61000); // P1

    startRound(game, 90000);
    submitChoice(game, "player1", "ciseaux");
    submitChoice(game, "player2", "pierre");
    resolveRound(game, 91000); // P2

    startRound(game, 120000);
    submitChoice(game, "player1", "feuille");
    submitChoice(game, "player2", "pierre");
    resolveRound(game, 121000); // P1

    expect(game.roundsPlayed).toBe(5);
    expect(game.score).toEqual({ player1: 3, player2: 2 });
    expect(game.status).toBe("finished");
    expect(game.winner).toBe("player1");
  });

  it("refuse de démarrer une nouvelle manche après la fin de partie", () => {
    const game = createGame();

    startRound(game, 0);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 1000); // P1

    startRound(game, 30000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 31000); // P1

    startRound(game, 60000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 61000); // P1

    startRound(game, 90000);
    submitChoice(game, "player1", "pierre");
    submitChoice(game, "player2", "ciseaux");
    resolveRound(game, 91000); // P1 -> fin

    expect(() => startRound(game, 120000)).toThrow(
      "La partie est déjà terminée"
    );
  });
});