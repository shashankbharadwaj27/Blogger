const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: apiKey });

async function generateBlog(req,res){
    const {title, preview} = req.body;

    if(!title || !preview){
        return res.status(400).json({ message: "Title and preview are required" });
    }

    try{
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Title: ${title}\nPreview: ${preview}\nGenerate the full post body.` ,
            config: {
                systemInstruction: `
                    You are a professional blog writer. 
                    Generate a well-structured blog post body that is coherent, engaging, 
                    and formatted for web reading. 
                    - Use paragraphs for separate ideas.
                    - Use headings (<h4>, <h5>) where appropriate.
                    - Use lists (<ul>/<ol>) for steps or examples.
                    - Emphasize important points with <strong> or <em>.
                    - Keep the style informative, friendly, and readable.
                    - Do not include any scripts or unsafe HTML.
                `,
            },
            max_tokens: 500
        });

        const body = response.text;
        res.json({ body });

    }catch(err){
        console.error(err);
        res.status(500).json({ message: "AI generation failed" });
    }

}

async function enhanceBlog(req,res){
    const {body} = req.body;

    if(!body){
        return res.status(400).json({message:"Body is required to enhance"});
    }

    try{
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Enhance the following blog content:\n\n${body}`,
            config: {
                systemInstruction: `
                    You are a professional blog editor and formatter.
                    Take the existing content and produce a polished, coherent blog post body.
                    - Keep original meaning and style.
                    - Format for web reading: use paragraphs, headings, lists, and emphasis.
                    - Make the language smooth, engaging, and clear.
                    - Output HTML-ready text that is safe to render (<p>, <ul>, <ol>, <li>, <strong>, <em>, <h2>, <h3>, <br> allowed).
                    - Do not provide alternative versions; return one enhanced version only.
                `
            },
            max_tokens: 500
        });

        const enhancedBody = response.text;
        res.json({ body : enhancedBody });

    }catch(err){
        console.error(err);
        res.status(500).json({ message: "AI generation failed" });
    }
}

module.exports = {generateBlog, enhanceBlog}