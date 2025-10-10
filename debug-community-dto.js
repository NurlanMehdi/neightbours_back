// Test the filtering logic
const community = {
  id: 41,
  name: "EWEWF",
  createdBy: 1,
  users: [
    {
      userId: 2,
      joinedViaCode: true,
      user: { id: 2, firstName: "Петр", lastName: "Петров" }
    }
  ]
};

// Current logic
const joinedViaCodeCount = community.users?.filter((user) => 
  user.joinedViaCode === true && user.userId !== community.createdBy
).length ?? 0;

console.log("Current logic result:", joinedViaCodeCount);
console.log("Should be:", 1);
console.log("Match:", joinedViaCodeCount === 1 ? "✅" : "❌");

// Debug
console.log("\nDebug:");
community.users.forEach(user => {
  console.log(`  userId: ${user.userId}, joinedViaCode: ${user.joinedViaCode}, createdBy: ${community.createdBy}`);
  console.log(`  Check: ${user.joinedViaCode === true} && ${user.userId !== community.createdBy} = ${user.joinedViaCode === true && user.userId !== community.createdBy}`);
});
