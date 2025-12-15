import fs from "fs/promises";
import path from "path";




const templetesDir = path.join(process.cwd(), "src/templates/emails");


// Replace {{variable}} with actual value

// data: { name: 'John Doe', verificationUrl: 'https://example.com/verify' }

// { productName: 'Headshot Generator', name: 'John Doe', verificationUrl: 'https://example.com/verify', price: 100, quantity: 2 }

function interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/{{(.*?)}}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    })
}


// Render HTML template

async function render(templateName: string, data: Record<string, any>): Promise<string> {
    const templatePath = path.join(templetesDir, templateName + ".html");
    const template = await fs.readFile(templatePath, "utf-8");
    return interpolate(template, data);
}

// Render text template
// Render HTML template

async function renderText(templateName: string, data: Record<string, any>): Promise<string> {
    const templatePath = path.join(templetesDir, templateName + ".txt");
    const template = await fs.readFile(templatePath, "utf-8");
    return interpolate(template, data);
}


export const templateEngine = {
    render,
    renderText,
}