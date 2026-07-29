/**
 * Genereert unieke testdata per testrun, zodat registratietests
 * (RT-REG-004 t/m 007) herhaaldelijk kunnen draaien zonder te botsen
 * op "account/email bestaat al".
 *
 * E-mailpatroon: jan.de.wit+AI{n}@nbn.be
 * Alle "+AI{n}"-aliassen komen toe in dezelfde inbox (jan.de.wit@nbn.be),
 * wat ook nuttig is voor RT-REG-001/002/003 (verificatiecode opzoeken).
 *
 * Het nummer wordt bijgehouden in testCounter.json zodat opeenvolgende
 * testruns nooit hetzelfde adres hergebruiken, ook niet na een herstart.
 */
import * as fs from 'fs';
import * as path from 'path';

const COUNTER_FILE = path.join(__dirname, '..', 'testCounter.json');

function getNextTestNumber(): number {
  let counter = 0;
  try {
    const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf-8'));
    counter = data.counter ?? 0;
  } catch {
    // Bestand bestaat nog niet, start bij 0
  }
  const next = counter + 1;
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ counter: next }, null, 2));
  return next;
}

export function generateUniqueEmail(): string {
  const n = getNextTestNumber();
  return `jan.de.wit+AI${n}@nbn.be`;
}

export function generateTestUser() {
  const email = generateUniqueEmail();
  return {
    email,
    firstName: 'Jan',
    lastName: 'De Wit',
    password: 'NbnQaTest#2026', // Zelf gekozen testwachtwoord; pas aan indien wachtwoordvereisten anders zijn
  };
}