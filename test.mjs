import { Deepgram } from "@deepgram/sdk";
const dg = new Deepgram("72ea27fdcbb164af025d4eac5db5be0071416e08");
console.log(typeof dg.audio.transcription.preRecorded); // should be "function"
