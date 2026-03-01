import Employee from "../models/Employee.mjs";

const seedEmployees = async () => {
  try {
    const count = await Employee.countDocuments();

    // Only seed if collection is empty
    if (count === 0) {
      console.log("Seeding employees...");

      await Employee.insertMany([
        {
          firstName: "Light",
          lastName: "Bekete",
          email: "superadmin@madzi.com",
          phoneNumber: "0999970149",
          position: "System Engineer",
          department: "IT",
        },
        {
          firstName: "Terrence",
          lastName: "kabango",
          email: "terrence@madzi.com",
          phoneNumber: "0888000002",
          position: "Lecturer",
          department: "Water Treatment and Monitoring",
        },
        {
          firstName: "Grace",
          lastName: "Mphande",
          email: "grace@madzi.com",
          phoneNumber: "0888000003",
          position: "Technician",
          department: "Maintenance",
        },
        {
          firstName: "Bryan",
          lastName: "Nathupo",
          email: "bryan@madzi.com",
          phoneNumber: "0888000004",
          position: "HR Officer",
          department: "Human Resources",
        },
        {
          firstName: "James",
          lastName: "Chilima",
          email: "james@madzi.com",
          phoneNumber: "0888000005",
          position: "Operations Manager",
          department: "Operations",
        },
      ]);

      console.log("Employees seeded successfully ✅");
    } else {
      console.log("Employees already exist — skipping seeding");
    }
  } catch (error) {
    console.error("Seeding error:", error.message);
  }
};

export default seedEmployees;