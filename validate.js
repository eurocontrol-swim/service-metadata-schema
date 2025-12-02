const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");

// Inizializza AJV senza validare schemi e senza caricare meta-schema
const ajv = new Ajv2020({ 
  strict: true, 
  validateSchema: false, // Non validare gli schemi caricati
  allErrors: true,
  strictTypes: false,
  strictSchema: false,
  strictRequired: false  
});
addFormats(ajv);

async function run() {
  console.log("=== Inizio validazione ===\n");
  
  try {

    const geoJsonSchema = JSON.parse(await fs.promises.readFile("./common/GeometryCollection.json", "utf8"));
    ajv.addSchema(geoJsonSchema);
    console.log("✓ Schema GeoJSON GeometryCollection caricato");

    // Carica gli schemi direttamente
    const commonTypes = JSON.parse(await fs.promises.readFile("./common/common-types.schema.json", "utf8"));
    //const serviceDescription = JSON.parse(await fs.promises.readFile("./description/service_description.schema.json", "utf8"));
    const serviceDescription = JSON.parse(await fs.promises.readFile("./definition/service_definition.schema.json", "utf8"));

    // Registra common-types
    ajv.addSchema(commonTypes, commonTypes.$id || "common-types");
    console.log("✓ Schema common-types caricato");
    
    // Compila service_description
    const validate = ajv.compile(serviceDescription);
    console.log("✓ Schema service_description compilato\n");
    
    // Carica i dati da validare
    const data = JSON.parse(await fs.promises.readFile("./description/test.json", "utf8"));
    
    // Valida
    const valid = validate(data);
    
    if (valid) {
      console.log("✓ Validazione OK!");
    } else {
      console.error("✗ Errori di validazione:");
      console.error(JSON.stringify(validate.errors, null, 2));
    }
    
  } catch (error) {
    console.error("\n=== ERRORE ===");
    console.error(error.message);
    if (error.errors) {
      console.error("Dettagli errori AJV:");
      console.error(JSON.stringify(error.errors, null, 2));
    }
  }
}

run();
