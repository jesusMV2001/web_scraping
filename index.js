import { crearTablas } from "./db/database.js"
import { iniciarServidor } from "./api/api.js";

crearTablas();
iniciarServidor();