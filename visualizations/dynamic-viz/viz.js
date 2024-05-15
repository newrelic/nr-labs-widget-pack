import React, { useEffect, useState } from "react";
import { LineChart, Spinner, BillboardChart, BarChart } from "nr1";
import { useInterval } from "@mantine/hooks";
import Docs from "./docs";
import ErrorState from "../../shared/ErrorState";
import { toBar, toBillboard, transformData } from "./transform";
import DynamicTable from "./table";
import { parseFiltersToJSON, performFilterSubstitutions } from "./utils";

var alasql = window.alasql;
const _ = require("lodash");

function fetchWithRetry(source, jsonFilters, retries = 3, backoff = 300) {
  return new Promise(async (resolve, reject) => {
    let { url, basicAuthUser, basicAuthPass, options, payload, method } =
      source;
    url = performFilterSubstitutions(url, jsonFilters);
    basicAuthUser = performFilterSubstitutions(basicAuthUser, jsonFilters);
    basicAuthPass = performFilterSubstitutions(basicAuthPass, jsonFilters);
    options = performFilterSubstitutions(options || "", jsonFilters);
    payload = performFilterSubstitutions(payload || "", jsonFilters);
    method = performFilterSubstitutions(method, jsonFilters);

    const parsedOptions = JSON.parse(options || "{}");
    console.log(options, parsedOptions);

    const finalOptions = { ...parsedOptions, method: method || "GET" };
    const headers = {};
    if (basicAuthUser) {
      headers.Authorization =
        "Basic " + btoa(basicAuthUser + ":" + (basicAuthPass || ""));
    }

    if (payload) {
      finalOptions.body = JSON.stringify(payload);
    }

    finalOptions.headers = headers;

    const proxiedUrl =
      "https://rfm21dgppf.execute-api.us-east-1.amazonaws.com/dev?url=" +
      encodeURIComponent(url);

    // const proxiedUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(proxiedUrl, finalOptions);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        const { jsonSelector } = source;
        const result = jsonSelector ? _.get(data, jsonSelector) : data;
        return resolve(result);
      } catch (error) {
        console.error(`Fetch attempt ${i + 1} failed:`, error.message);
        if (i === retries) return resolve(null); // Last attempt also failed, resolve with null
        await new Promise((resolve) =>
          setTimeout(resolve, backoff * Math.pow(2, i))
        ); // Exponential backoff
      }
    }
  });
}

function DynamicWidget(props) {
  const { pollInterval, httpSources, alaQuery, chartType, showDocs, filters } =
    props;
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setFetching] = useState(false);
  const [chartData, setChartData] = useState(null);
  // const [jsonFilters, setFilters] = useState(null);

  // const jsonFilters = parseFiltersToJSON(filters || "");

  const jsonFilters = filters;
  console.log("parsed filters => ", jsonFilters);

  useEffect(() => {
    console.log("new filters", filters);
  }, [filters]);

  useEffect(() => {
    alasql = window.alasql;
  }, []);

  const interval = useInterval(() => {
    if (httpSources.length > 0 && errors.length === 0) {
      fetchData();
    }
  }, (pollInterval || 60) * 1000);

  const fetchData = async () => {
    if (errors.length === 0 && isFetching === false) {
      setFetching(true);

      console.log("fetch filters =>", jsonFilters);

      const httpPromises = httpSources.map((source) =>
        fetchWithRetry(source, jsonFilters)
      );
      const httpDataJson = await Promise.all(httpPromises);
      setFetching(false);

      console.log("raw data ->", httpDataJson);

      if (httpDataJson.some((a) => !a)) {
        console.log("null values detected, do not update chartData");
      } else {
        const alaData = alasql(alaQuery, httpDataJson);

        console.log("in memory query ->", alaData);

        setChartData(alaData);
      }
    }
  };

  useEffect(() => {
    //
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [pollInterval, httpSources]);

  useEffect(async () => {
    setLoading(true);
    const tempErrors = [];

    if (!alaQuery) {
      tempErrors.push({
        name: "SQL Query missing",
      });
    }

    if (httpSources.length === 0) {
      tempErrors.push({
        name: "You need to supply at least one http source",
      });
    } else {
      httpSources.forEach((t, i) => {
        const { url, payload, method, options } = t;
        const errorObj = { name: `HTTP Source ${i + 1}`, errors: [] };

        if (!url) {
          errorObj.errors.push(`URL is undefined`);
        }

        if (options) {
          try {
            JSON.parse(options);
          } catch (e) {
            errorObj.errors.push(`Options has invalid JSON`);
          }
        }

        if (payload) {
          if (!method || method.toLowerCase() === "GET") {
            errorObj.errors.push(`Payload not supported with GET method`);
          }
          try {
            JSON.parse(payload);
          } catch (e) {
            errorObj.errors.push(`Payload has invalid JSON`);
          }
        }

        if (errorObj.errors.length > 0) {
          tempErrors.push(errorObj);
        }
      });
    }

    setErrors(tempErrors);
    setLoading(false);
  }, [httpSources]);

  if (loading) {
    return <Spinner />;
  }

  if (errors.length > 0) {
    return <ErrorState errors={errors} showDocs={showDocs} Docs={Docs} />;
  }

  const renderViz = (chartType, chartData, props) => {
    if (!chartData || chartData.length === 0 || chartData.some((a) => !a)) {
      return (
        <>
          <Spinner />
        </>
      );
    }

    if (!chartType || chartType === "billboard") {
      return (
        <BillboardChart data={toBillboard(chartData)} fullWidth fullHeight />
      );
    }

    if (chartType === "bar") {
      return <BarChart data={toBar(chartData)} fullWidth fullHeight />;
    }

    if (chartType === "table") {
      return <DynamicTable chartData={chartData || []} {...props} />;
    }

    return <></>;
  };

  return (
    <>
      {showDocs && <Docs />}

      {renderViz(chartType, chartData, props)}
    </>
  );
}

export default DynamicWidget;
