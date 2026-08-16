import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PropsTable } from "./composition-tree";

describe("PropsTable", () => {
  it("renders each generated public-prop description under a named column", () => {
    const html = renderToStaticMarkup(
      <PropsTable
        groups={[
          {
            name: "ProbeProps",
            props: [
              {
                name: "locale",
                type: "Locale",
                required: true,
                description: "The locale that determines formatting and direction.",
              },
            ],
          },
        ]}
        propHeader="Prop"
        typeHeader="Type"
        descriptionHeader="Description"
        requirementHeader="Requirement"
        requiredLabel="Required"
        optionalLabel="Optional"
      />,
    );

    expect(html).toContain(">Description<");
    expect(html).toContain("The locale that determines formatting and direction.");
  });
});
