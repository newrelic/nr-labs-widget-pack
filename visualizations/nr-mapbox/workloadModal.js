import React, { useEffect, useState } from 'react';

import {
  HeadingText,
  BlockText,
  Button,
  Modal,
  Spinner,
  ngql,
  NerdGraphQuery,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  EntityTitleTableRowCell
} from 'nr1';

const async = require('async');

const QUEUE_LIMIT = 5;

export const workloadEntityQuery = cursor => ngql`query workloadsEntityQuery ($workloadGuid: EntityGuid!){
  actor {
    entity(guid: $workloadGuid) {
      ... on WorkloadEntity {
        alertSeverity
        reporting
        guid
        name
        account {
          id
          name
        }
        relatedEntities(filter: {direction: OUTBOUND} ${
          cursor ? `, cursor: "${cursor}"` : ''
        }) {
          results {
            target {
              entity {
                name
                alertSeverity
                reporting
                account {
                  id
                  name
                }
                domain
                entityType
                type
              }
              guid
            }
          }
          nextCursor
        }
      }
    }
  }
}`;

// anna workload -> MTYwNjg2MnxOUjF8V09SS0xPQUR8MjI0MDk4

export default function WorkloadModal({ workloadStatus, setWorkloadStatus }) {
  const [loading, setLoading] = useState(false);
  const [workloadData, setWorkloadData] = useState(null);

  useEffect(async () => {
    setLoading(true);
    await getWorkloadData();
    setLoading(false);
  }, [workloadStatus]);

  const getWorkloadData = () => {
    // const workloadGuids = [workloadStatus['entity.guid']];
    const workloadGuids = ['MTYwNjg2MnxOUjF8V09SS0xPQUR8MjI0MDk4'];

    return new Promise(resolve => {
      // do not chunk workload entity guids, work on them separately
      const workloadGuidMap = workloadGuids.map(guid => ({ guid }));

      // get all related entities under a workload
      const tempWorkloadData = {};
      const workloadQueue = async.queue((task, callback) => {
        const { guid, nextCursor } = task;

        NerdGraphQuery.query({
          query: workloadEntityQuery(nextCursor),
          variables: { workloadGuid: guid }
        }).then(response => {
          if (response.error?.graphQLErrors) {
            // eslint-disable-next-line
            console.log(response.error?.graphQLErrors);
          } else {
            const entity = response?.data?.actor?.entity;

            if (entity) {
              const relatedEntities = entity?.relatedEntities;

              if (!tempWorkloadData[entity.guid]) {
                tempWorkloadData[entity.guid] = entity;
              } else {
                tempWorkloadData[entity.guid].relatedEntities.results = [
                  ...tempWorkloadData[entity.guid].relatedEntities.results,
                  ...(entity?.relatedEntities?.results || [])
                ];
              }

              // check if next cursor and fetch related entities
              if (relatedEntities?.nextCursor) {
                workloadQueue.push({
                  guid,
                  nextCursor: relatedEntities?.nextCursor
                });
              }
            }
          }

          callback();
        });
      }, QUEUE_LIMIT);

      workloadQueue.push(workloadGuidMap);

      workloadQueue.drain(() => {
        setWorkloadData(tempWorkloadData);
        resolve(tempWorkloadData);
      });
    });
  };

  return (
    <Modal
      hidden={workloadStatus === null}
      onClose={() => setWorkloadStatus(null)}
    >
      <HeadingText type={HeadingText.TYPE.HEADING_3}>
        Workload Status
      </HeadingText>
      <br />
      <Button
        type={Button.TYPE.NORMAL}
        onClick={() => {
          window.open(
            `https://one.newrelic.com/redirect/entity/${workloadData['entity.guid']}`
          );
        }}
      >
        Open Workload
      </Button>

      <BlockText spacingType={[BlockText.SPACING_TYPE.OMIT]}>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Table
              items={(
                workloadData?.['entity.guid']?.relatedEntities?.results || []
              ).map(res => {
                const entity = res?.target?.entity || {};
                return entity;
              })}
            >
              <TableHeader>
                <TableHeaderCell value={({ item }) => item.name}>
                  Entity Name
                </TableHeaderCell>
                <TableHeaderCell value={({ item }) => item.account?.name}>
                  Account Name
                </TableHeaderCell>
                <TableHeaderCell value={({ item }) => item.account?.id}>
                  Account ID
                </TableHeaderCell>
                {/* <TableHeaderCell value={({ item }) => item.id}>
                  entityGuid
                </TableHeaderCell> */}
              </TableHeader>
              {({ item }) => (
                <TableRow
                  onClick={() => {
                    window.open(
                      `https://one.newrelic.com/redirect/entity/${item.guid}`
                    );
                  }}
                >
                  <EntityTitleTableRowCell value={item} />
                  <TableRowCell>{item.account?.name}</TableRowCell>
                  <TableRowCell>{item.account?.id}</TableRowCell>
                  {/* <TableRowCell>{item.guid}</TableRowCell> */}
                </TableRow>
              )}
            </Table>
          </>
        )}
      </BlockText>

      <br />

      <Button onClick={() => setWorkloadStatus(null)}>Close</Button>
    </Modal>
  );
}
