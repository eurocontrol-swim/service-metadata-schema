const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");
const readline = require('readline');

// Initialise AJV without validating the schemas and load the meta-schema
const ajv = new Ajv2020({
  strict: true,
  validateSchema: false, // Do not validate loaded schemas
  allErrors: true,
  strictTypes: false,
  strictSchema: false,
  strictRequired: false
});
addFormats(ajv);

function askQuestion(query) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function run() {
  validationType = "";
  const answer = await askQuestion('Choose what you want to validate. 1 for service description or 2 for service definition: ');
  if (answer === '1') {
    console.log('You chose option 1: validate service description');
    validationType = "description";
  } else if (answer === '2') {
    console.log('You chose option 2: validate service definition');
    validationType = "definition";
  } else {
    console.log('Invalid choice');
  }
  console.log("=== Start validation ===\n");

  try {

    const geoJsonSchema = JSON.parse(await fs.promises.readFile("./common/GeometryCollection.json", "utf8"));
    ajv.addSchema(geoJsonSchema);
    console.log("✓ GeoJSON GeometryCollection loaded");

    // Directly Loads the schemas
    const referenceCodeTypes = JSON.parse(await fs.promises.readFile("./common/reference-code-types.schema.json", "utf8"));

    const commonTypes = JSON.parse(await fs.promises.readFile("./common/common-types.schema.json", "utf8"));
    service = null;
    data = null;

    if (validationType === "description") {
      service = JSON.parse(await fs.promises.readFile("./description/service-description.schema.json", "utf8"));
      // Loads data for validation
      data = JSON.parse(await fs.promises.readFile("./testDescription.json", "utf8"));
    }
    if (validationType === "definition") {
      service = JSON.parse(await fs.promises.readFile("./definition/service-definition.schema.json", "utf8"));
      // Loads data for validation
      data = JSON.parse(await fs.promises.readFile("./testDefinition.json", "utf8"));
    }
    if (validationType === "") {
      throw new Error("No valid choice made for validation. Please choose either 1 or 2.");
    }

    // Registers reference-code-types
    ajv.addSchema(referenceCodeTypes, referenceCodeTypes.$id || "reference-code-types");
    console.log("✓ Schema reference-code-types loaded");

    // Registers common-types
    ajv.addSchema(commonTypes, commonTypes.$id || "common-types");
    console.log("✓ Schema common-types loaded");

    // Compiles service_description
    const validate = ajv.compile(service);
    console.log("✓ Service Schema compiled\n");

    // Validates
    const valid = validate(data);

    if (valid) {
      console.log("✓ Validation OK!");
    } else {
      console.error("✗ Validation Errors:");
      console.error(JSON.stringify(validate.errors, null, 2));
    }

  } catch (error) {
    console.error("\n=== ERRORS ===");
    console.error(error.message);
    if (error.errors) {
      console.error("AJV Error details:");
      console.error(JSON.stringify(error.errors, null, 2));
    }
  }
}

run();
