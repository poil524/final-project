import DOMPurify from "dompurify";

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function EssayDisplay({ content }) {
  const decodedContent = decodeHtml(content);
  const cleanContent = DOMPurify.sanitize(decodedContent, {
  USE_PROFILES: { html: true },
  FORBID_ATTR: ['style']
});

  return (
    <div className="essay-display" dangerouslySetInnerHTML={{ __html: cleanContent }} />
  );
}

export default EssayDisplay;
