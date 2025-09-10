// Exemple de "controller"
function getUsers(req, res) {
  res.json([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);
}

module.exports = { getUsers };
