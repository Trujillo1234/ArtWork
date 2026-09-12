const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "data.js");
const source = `${fs.readFileSync(dataPath, "utf8")}
this.artworks = artworks;
this.archiveImageRoles = archiveImageRoles;
this.archiveReviewIssues = archiveReviewIssues;`;

const context = {};
vm.createContext(context);
vm.runInContext(source, context, { filename: dataPath });

const { artworks, archiveImageRoles, archiveReviewIssues } = context;
const allImages = artworks.flatMap((item) => item.images.map((file, index) => ({ item, file, index })));
const ids = artworks.map((item) => item.id);
const refs = allImages.map((entry) => entry.file);

const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const roleOf = ({ item, file, index }) => archiveImageRoles[file] || (index === 0 ? "lead view" : "supporting view");
const titleDerivedContextLead = (item) => {
  const title = item.title.toLowerCase();
  return /\b(backing page|back view|reverse)\b/.test(title) && !/\bfront\b/.test(title);
};

const findings = [
  ...duplicates(ids).map((id) => ({ level: "fail", rule: "duplicate-id", detail: id })),
  ...duplicates(refs).map((file) => ({ level: "fail", rule: "duplicate-image-reference", detail: file })),
  ...allImages
    .filter(({ file }) => !fs.existsSync(path.join(root, "assets", "artwork", file)))
    .map(({ item, file }) => ({ level: "fail", rule: "missing-image", detail: `${item.id}: ${file}` })),
  ...allImages
    .filter((entry) => entry.index === 0 && /reverse|backing|supporting/i.test(roleOf(entry)) && !titleDerivedContextLead(entry.item))
    .map(({ item, file }) => ({ level: "fail", rule: "non-primary-lead-image", detail: `${item.title}: ${file}` })),
  ...artworks
    .filter(titleDerivedContextLead)
    .map((item) => ({ level: "warn", rule: "title-derived-context-lead", detail: `${item.title}: title or note says this is backing/reverse context` })),
  ...archiveReviewIssues
    .filter((issue) => /packet/i.test(issue.kind))
    .map((issue) => {
      const owner = allImages.find((entry) => entry.file === issue.file);
      return owner ? { level: "warn", rule: "named-packet-split", detail: `${owner.item.title}: ${issue.action}` } : { level: "warn", rule: "orphan-review-issue", detail: issue.file };
    }),
  ...artworks
    .filter((item) => /certificate|diploma|report/i.test(`${item.title} ${item.type}`) && !/Certificate|Diploma|Schoolwork/.test(item.type))
    .map((item) => ({ level: "warn", rule: "document-type-review", detail: `${item.title}: ${item.type}` })),
  ...archiveReviewIssues
    .map((issue) => {
      const owner = allImages.find((entry) => entry.file === issue.file);
      return owner ? { level: "info", rule: "known-review-issue", detail: `${owner.item.title}: ${issue.kind} - ${issue.action}` } : { level: "warn", rule: "orphan-review-issue", detail: issue.file };
    })
];

const grouped = findings.reduce((groups, finding) => {
  if (!groups[finding.level]) groups[finding.level] = [];
  groups[finding.level].push(finding);
  return groups;
}, {});

console.log(JSON.stringify({
  records: artworks.length,
  photos: refs.length,
  duplicateIds: duplicates(ids).length,
  duplicateImageReferences: duplicates(refs).length,
  missingImages: findings.filter((finding) => finding.rule === "missing-image").length,
  nonPrimaryLeadImages: findings.filter((finding) => finding.rule === "non-primary-lead-image").length,
  titleDerivedContextLeads: findings.filter((finding) => finding.rule === "title-derived-context-lead").length,
  namedPacketSplits: findings.filter((finding) => finding.rule === "named-packet-split").length,
  knownReviewIssues: archiveReviewIssues.length,
  findings: grouped
}, null, 2));

if ((grouped.fail || []).length) {
  process.exitCode = 1;
}
