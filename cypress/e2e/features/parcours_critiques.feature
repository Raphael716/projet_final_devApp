Feature: Parcours critiques

  Scenario: Authentification réussie (admin)
    Given j'ouvre la page de connexion
    When je me connecte avec l'email "admin@example.com" et le mot de passe "super-secret"
    Then je suis redirigé vers "/" et je vois "Utilisateurs" dans la navigation

  Scenario: Création d'un build et affichage du détail
    Given je suis connecté en tant qu'admin
    When je crée un build avec le nom "Nouveau Build" et la version "2.0.0"
    Then je suis redirigé vers la page du build et je vois le nom "Nouveau Build"

  Scenario: Archivage d'un build par l'admin
    Given la liste de builds contient un élément appelé "Logiciel Beta"
    When j'archive le build nommé "Logiciel Beta"
    Then le build "Logiciel Beta" n'est plus visible dans la liste
