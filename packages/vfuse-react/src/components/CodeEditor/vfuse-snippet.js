// import your snippet
import snippet from './javascript-snippet';

// SUPER HACK FOR ADDING SNIPPETS
ace.define("ace/snippets/vfuse-javascirpt", ["require", "exports", "module"], (e, t, n) => {
    // eslint-disable-next-line
    (t.snippetText = snippet), (t.scope = "json");
});
