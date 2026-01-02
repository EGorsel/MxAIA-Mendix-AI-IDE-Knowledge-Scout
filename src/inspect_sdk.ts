
import { pages, navigation } from "mendixmodelsdk";

console.log("Pages keys:", Object.keys(pages).filter(k => k.includes("Source")));
console.log("Navigation keys:", Object.keys(navigation));

// Check specifically for XPathSource or similar
const possibleSources = [
    "XPathSource", "EntitySource", "DatabaseSource", "MicroflowSource", "AssociationSource", "RestSource"
];
possibleSources.forEach(s => {
    if ((pages as any)[s]) console.log(`Found pages.${s}`);
});
