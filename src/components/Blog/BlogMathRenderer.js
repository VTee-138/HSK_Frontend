import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

const BlogMathRenderer = ({ content }) => {
  const contentRef = useRef(null);
  // Thay thế các ký hiệu latex block như \[...\] bằng $...$
  content = content.replaceAll("\\[", "$");
  content = content.replaceAll("\\]", "$");
  useEffect(() => {
    if (contentRef.current && content) {
      renderMath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Utility function to clean HTML from LaTeX formula
  const cleanLatexFormula = (formula) => {
    let cleanFormula = formula.trim();
    console.log(" cleanLatexFormula ~ cleanFormula:", cleanFormula);

    // Remove HTML tags
    cleanFormula = cleanFormula.replace(/<[^>]*>/g, "");

    // Remove extra whitespace and normalize
    cleanFormula = cleanFormula.replace(/\s+/g, " ").trim();

    // Replace HTML entities
    cleanFormula = cleanFormula.replace(/&nbsp;/g, " ");
    cleanFormula = cleanFormula.replace(/&lt;/g, "<");
    cleanFormula = cleanFormula.replace(/&gt;/g, ">");
    cleanFormula = cleanFormula.replace(/&amp;/g, "&");
    cleanFormula = cleanFormula.replace(/&quot;/g, '"');
    cleanFormula = cleanFormula.replace(/&#39;/g, "'");

    // Remove zero-width characters
    cleanFormula = cleanFormula.replace(/[\u200B-\u200D\uFEFF]/g, "");

    return cleanFormula;
  };

  const renderMath = () => {
    const element = contentRef.current;
    if (!element) return;

    // Set HTML content first
    element.innerHTML = content;

    // Find and render inline math (enclosed in $ ... $)
    const inlineMathRegex = /\$([^$]+)\$/g;
    let htmlContent = element.innerHTML;

    htmlContent = htmlContent.replace(inlineMathRegex, (match, formula) => {
      try {
        // Clean formula using utility function
        let cleanFormula = cleanLatexFormula(formula);

        // Handle common LaTeX issues
        cleanFormula = cleanFormula.replaceAll("^^\\circ", "^\\circ");
        // Check if formula contains Vietnamese characters (skip rendering)
        if (/[à-ỹ]/i.test(cleanFormula)) {
          return match; // Return original if contains Vietnamese
        }

        const html = katex.renderToString(cleanFormula, {
          throwOnError: false,
          displayMode: false,
        });
        return html;
      } catch (error) {
        console.warn("KaTeX rendering error:", error);
        return match; // Return original if error
      }
    });

    // Find and render display math (enclosed in $$ ... $$ or \[ ... \])
    const displayMathRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;

    htmlContent = htmlContent.replace(
      displayMathRegex,
      (match, formula1, formula2) => {
        try {
          // Clean formula using utility function
          let cleanFormula = cleanLatexFormula(formula1 || formula2);

          // Handle system of equations
          if (
            cleanFormula.includes("{\\begin{array}{*{20}{l}}") ||
            cleanFormula.includes("{\\begin{array}{*{20}{r}}") ||
            cleanFormula.includes("{\\begin{array}{*{20}{c}}") ||
            cleanFormula.includes("\\begin{cases}") ||
            cleanFormula.includes("\\begin{array}")
          ) {
            cleanFormula = cleanFormula.replaceAll("\\left\\{", "");
            cleanFormula = cleanFormula.replaceAll(/\\left\[/g, "");
            cleanFormula = cleanFormula.replaceAll("} \\right.}", "");
            cleanFormula = cleanFormula.replaceAll("\\right.}", "");
            cleanFormula = cleanFormula.replaceAll(/\\right\./g, "");

            cleanFormula = cleanFormula.replaceAll(
              "{\\begin{array}{*{20}{l}}",
              "\\begin{cases}"
            );
            cleanFormula = cleanFormula.replaceAll(
              "{\\begin{array}{*{20}{r}}",
              "\\begin{cases}"
            );
            cleanFormula = cleanFormula.replaceAll(
              "{\\begin{array}{*{20}{c}}",
              "\\begin{cases}"
            );
            cleanFormula = cleanFormula.replaceAll(
              "\\begin{array}{l}",
              "\\begin{cases}"
            );
            cleanFormula = cleanFormula.replaceAll(
              "\\begin{array}{c}",
              "\\begin{cases}"
            );
            cleanFormula = cleanFormula.replaceAll(
              "\\begin{array}{r}",
              "\\begin{cases}"
            );
            cleanFormula = cleanFormula.replaceAll("end{array}}", "end{cases}");
            cleanFormula = cleanFormula.replaceAll(
              "\\end{array}",
              "\\end{cases}"
            );
            cleanFormula = cleanFormula.replaceAll(
              "{\\rm{ suy ra }}",
              "\\quad \\Rightarrow \\quad"
            );

            // Clean up line breaks in cases environment
            cleanFormula = cleanFormula.replace(
              /\\begin\{cases\}\s*/g,
              "\\begin{cases}\n"
            );
            cleanFormula = cleanFormula.replace(
              /\s*\\end\{cases\}/g,
              "\n\\end{cases}"
            );
            cleanFormula = cleanFormula.replace(/\\\\\s*/g, " \\\\\n");
          } else if (cleanFormula.includes("\\begin{array}{*{20}{l}}")) {
            cleanFormula = cleanFormula.replaceAll(
              "\\begin{array}{*{20}{l}}",
              "\\begin{aligned}"
            );
            cleanFormula = cleanFormula.replaceAll(
              "\\end{array}",
              "\\end{aligned}"
            );
          }

          // Handle matrices
          if (
            cleanFormula.includes("\\begin{pmatrix}") ||
            cleanFormula.includes("\\begin{bmatrix}")
          ) {
            cleanFormula = cleanFormula.replace(/\\\\\s*/g, " \\\\\n");
          }

          cleanFormula = cleanFormula.replaceAll("^^\\circ", "^\\circ");

          // Check if formula contains Vietnamese characters (skip rendering)
          if (/[à-ỹ]/i.test(cleanFormula)) {
            return match; // Return original if contains Vietnamese
          }

          const html = katex.renderToString(cleanFormula, {
            throwOnError: false,
            displayMode: true,
          });
          return `<div class="katex-display-wrapper" style="margin: 1em 0; text-align: center;">${html}</div>`;
        } catch (error) {
          console.warn("KaTeX rendering error:", error);
          return match; // Return original if error
        }
      }
    );

    element.innerHTML = htmlContent;
  };

  return (
    <div
      ref={contentRef}
      className="blog-math-content"
      style={{
        lineHeight: "1.8",
        fontSize: "16px",
        color: "#374151",
      }}
    />
  );
};

export default BlogMathRenderer;
