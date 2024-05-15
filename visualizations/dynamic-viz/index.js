import React, { useEffect, useState, useContext } from "react";
import { Spinner, AutoSizer, NerdletStateContext } from "nr1";
import DynamicWidget from "./viz";

const { version } = require("../../package.json");

function DynamicWidgetRoot(props) {
  const [loading, setLoading] = useState(true);
  const { filters } = useContext(NerdletStateContext);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/alasql/4.2.7/alasql.min.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      setLoading(false);
    };

    script.onerror = (error) => {
      console.error("Error loading the Alasql script:", error);
    };
  }, []);

  console.log(`widget version: ${version}`);

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <div style={{ height: "100%", overflowX: "hidden" }}>
          <AutoSizer>
            {({ width, height }) => (
              <DynamicWidget
                {...props}
                filters={filters}
                width={width}
                height={height}
              />
            )}
          </AutoSizer>
        </div>
      )}
    </>
  );
}

export default DynamicWidgetRoot;
