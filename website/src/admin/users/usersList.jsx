import { useCollection } from '@cloudscape-design/collection-hooks';
import { Header, Pagination, PropertyFilter, Table } from '@cloudscape-design/components';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '../../components/pageLayout';
import {
  PropertyFilterI18nStrings,
  TableEmptyState,
  TableNoMatchState,
} from '../../components/tableCommon';
import {
  DefaultPreferences,
  MatchesCountText,
  TablePreferences,
} from '../../components/tableConfig';
import {
  ColumnDefinitions,
  FilteringProperties,
  VisibleContentOptions,
} from '../../components/tableUserConfig';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToolsOptionsDispatch } from '../../store/appLayoutProvider';
import { useUsersContext } from '../../store/storeProvider';

export const UsersList = () => {
  const { t } = useTranslation();

  const [selectedItems] = useState([]);

  const [users, isLoading] = useUsersContext();
  const [preferences, setPreferences] = useLocalStorage('DREM-user-table-preferences', {
    ...DefaultPreferences,
    visibleContent: ['Username', 'Flag', 'UserCreateDate'],
  });

  // Help panel
  const toolsOptionsDispatch = useToolsOptionsDispatch();
  const helpPanelHidden = true;
  useEffect(() => {
    toolsOptionsDispatch({
      type: 'UPDATE',
      value: {
        //isOpen: true,
        isHidden: helpPanelHidden,
        // content: (
        //   <SimpleHelpPanelLayout
        //     headerContent={t('header', { ns: 'help-admin-events' })}
        //     bodyContent={t('content', { ns: 'help-admin-events' })}
        //     footerContent={t('footer', { ns: 'help-admin-events' })}
        //   />
        // ),
      },
    });

    return () => {
      toolsOptionsDispatch({ type: 'RESET' });
    };
  }, [toolsOptionsDispatch]);

  // Table config
  const columnDefinitions = ColumnDefinitions();
  const filteringProperties = FilteringProperties();
  const visibleContentOptions = VisibleContentOptions();

  const {
    items,
    actions,
    filteredItemsCount,
    collectionProps,
    paginationProps,
    propertyFilterProps,
  } = useCollection(users, {
    propertyFiltering: {
      filteringProperties,
      empty: <TableEmptyState resourceName="User" />,
      noMatch: (
        <TableNoMatchState
          onClearFilter={() => {
            actions.setPropertyFiltering({ tokens: [], operation: 'and' });
          }}
          label={t('common.no-matches')}
          description={t('common.we-cant-find-a-match')}
          buttonLabel={t('button.clear-filters')}
        />
      ),
    },
    pagination: { pageSize: preferences.pageSize },
    sorting: { defaultState: { sortingColumn: columnDefinitions[0], isDescending: false } },
    selection: {},
  });

  return (
    <PageLayout
      helpPanelHidden={helpPanelHidden}
      header={t('users-list.header')}
      breadcrumbs={[
        { text: t('home.breadcrumb'), href: '/' },
        { text: t('topnav.registration'), href: '/registration' },
        { text: t('users.breadcrumb') },
      ]}
    >
      <Table
        {...collectionProps}
        header={
          <Header
            counter={
              selectedItems.length
                ? `(${selectedItems.length}/${users.length})`
                : `(${users.length})`
            }
          >
            {t('users.header-list')}
          </Header>
        }
        columnDefinitions={columnDefinitions}
        items={items}
        stripedRows={preferences.stripedRows}
        contentDensity={preferences.contentDensity}
        wrapLines={preferences.wrapLines}
        pagination={
          <Pagination
            {...paginationProps}
            ariaLabels={{
              nextPageLabel: t('table.next-page'),
              previousPageLabel: t('table.previous-page'),
              pageLabel: (pageNumber) => `$(t{'table.go-to-page')} ${pageNumber}`,
            }}
          />
        }
        filter={
          <PropertyFilter
            {...propertyFilterProps}
            i18nStrings={PropertyFilterI18nStrings('users')}
            countText={MatchesCountText(filteredItemsCount)}
            filteringAriaLabel={t('users.filter-groups')}
            expandToViewport={true}
          />
        }
        loading={isLoading}
        loadingText={t('users.loading-groups')}
        visibleColumns={preferences.visibleContent}
        selectedItems={selectedItems}
        stickyHeader="true"
        trackBy="Username"
        resizableColumns
        preferences={
          <TablePreferences
            preferences={preferences}
            setPreferences={setPreferences}
            contentOptions={visibleContentOptions}
          />
        }
      />
    </PageLayout>
  );
};
