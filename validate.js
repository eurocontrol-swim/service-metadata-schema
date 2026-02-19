const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");

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

async function run() {
  console.log("=== Start validation ===\n");
  
  try {

    const geoJsonSchema = JSON.parse(await fs.promises.readFile("./common/GeometryCollection.json", "utf8"));
    ajv.addSchema(geoJsonSchema);
    console.log("✓ GeoJSON GeometryCollection loaded");

    // Directly Loads the schemas
    const referenceCodeTypes = JSON.parse(await fs.promises.readFile("./common/reference-code-types.schema.json", "utf8"));

    const commonTypes = JSON.parse(await fs.promises.readFile("./common/common-types.schema.json", "utf8"));
    //const serviceDescription = JSON.parse(await fs.promises.readFile("./description/service-description.schema.json", "utf8"));
    const serviceDescription = JSON.parse(await fs.promises.readFile("./definition/service-definition.schema.json", "utf8"));

    // Registers reference-code-types
    ajv.addSchema(referenceCodeTypes, referenceCodeTypes.$id || "reference-code-types");
    console.log("✓ Schema reference-code-types loaded");

    // Registers common-types
    ajv.addSchema(commonTypes, commonTypes.$id || "common-types");
    console.log("✓ Schema common-types loaded");
    
    // Compiles service_description
    const validate = ajv.compile(serviceDescription);
    console.log("✓ Schema service_description compiled\n");
    
    // Loads data for validation
    const data = JSON.parse(await fs.promises.readFile("./test.json", "utf8"));
    
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
