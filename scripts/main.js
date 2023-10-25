const url = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  let clientsList = await getClientsFromDataBase();
  let tableViewClientsList = getViewClientsList(clientsList);

  prepareEvironment();
  renderClientsTable(tableViewClientsList);

  function prepareEvironment() {
    addClientsFormSubmitEvent();
    addClientsFiltration();
    addTableSorting();
  }

  function addClientsFormSubmitEvent() {
    const clientsForm = document.getElementById('clients-form');
    clientsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      //https://stackoverflow.com/questions/66541564/how-to-hide-bootstrap-5-modal-only-on-success
      const clientsModal = document.getElementById('clients-modal-form');
      const clientsModalInstance = bootstrap.Modal.getInstance(clientsModal);

      const id = document.getElementById('id').value;
      const lastName = document.getElementById('last-name').value.trim();
      const firstName = document.getElementById('first-name').value.trim();
      const secondName = document.getElementById('second-name').value.trim();

      const client = await saveClientToDataBase({ id: id, surname: lastName, name: firstName, lastName: secondName, contacts: [], });
      tableViewClientsList.push(clientMapper(client));

      clientsForm.reset();
      clientsModalInstance.hide();

      renderClientsTable(tableViewClientsList);
    });
  }

  function addTableSorting() {
    const tableHeaders = document.getElementsByClassName('table__header-title');
    for (const tableHeaderTitle of tableHeaders) {
      tableHeaderTitle.addEventListener('click', () => {
        if (tableHeaderTitle.classList.contains('sorted')) {
          resetSorting();
          tableHeaderTitle.classList.add('sorted-reverse');
        } else if (tableHeaderTitle.classList.contains('sorted-reverse')) {
          resetSorting();
        } else {
          resetSorting();
          tableHeaderTitle.classList.add('sorted');
        }
        renderClientsTable(tableViewClientsList);
      });
    }
  }

  function resetSorting() {
    const tableHeaders = document.getElementsByClassName('table__header-title');
    for (const tableHeader of tableHeaders) {
      tableHeader.classList.remove('sorted');
      tableHeader.classList.remove('sorted-reverse');
    }
  }

  function addClientsFiltration() {
    const filter = document.getElementById('filter');
    filter.addEventListener('keyup', async (e) => {
      clientsList = !!e.target.value ? await searchClientsInDataBase(e.target.value) : await getClientsFromDataBase();
      tableViewClientsList = getViewClientsList(clientsList);
      renderClientsTable(tableViewClientsList);
    });
  }

  function getViewClientsList(clientsList) {
    return clientsList.map((client) => clientMapper(client));
  }

  function clientMapper(client) {
    return ({ id: client.id, name: `${client.surname} ${client.name} ${client.lastName}`, createDate: new Date(client.createdAt), updateDate: new Date(client.updatedAt), contacts: [], });
  }

  async function renderClientsTable(clientsList) {
    const viewClientsList = sortClientsTable(clientsList);

    const table = document.getElementById('clients-table');
    table.innerHTML = '';

    for (const client of viewClientsList) {
      const clientElement = createClientElement(client);
      table.append(clientElement);
    }
  }

  function createClientElement(client) {
    const tr = document.createElement('tr');
    tr.classList.add('table__row');

    for (const [key, value] of Object.entries(client)) {
      const td = document.createElement('td');
      td.classList.add('table__cell');
      td.textContent = value;
      tr.append(td);
    }

    const td = document.createElement('td');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    td.classList.add('table__cell');
    td.classList.add('table__cell_actions');
    editButton.classList.add('btn');
    editButton.classList.add('btn-success');
    editButton.textContent = 'Изменить';
    deleteButton.classList.add('btn');
    deleteButton.classList.add('btn-danger');
    deleteButton.textContent = 'Удалить';

    deleteButton.addEventListener('click', () => {
      if (!confirm('Вы уверены?')) return;
      const id = client.id;
      deleteClientFromDataBase(id);
      tableViewClientsList = tableViewClientsList.filter((client) => client.id !== id);
      renderClientsTable(tableViewClientsList);
    });

    td.append(editButton);
    td.append(deleteButton);
    tr.append(td);

    return tr;
  }

  function sortClientsTable(clientsList) {
    let sortedClientsList = [...clientsList];
    const tableHeaders = document.getElementsByClassName('table__header-title');
    for (const tableHeader of tableHeaders) {
      if (tableHeader.classList.contains('sorted')) {
        sortedClientsList = sortArrayByProperty(clientsList, bindSortValues(tableHeader.id), false);
      } else if (tableHeader.classList.contains('sorted-reverse')) {
        sortedClientsList = sortArrayByProperty(clientsList, bindSortValues(tableHeader.id), true);
      }
    }
    return sortedClientsList;
  }

  function bindSortValues(id) {
    switch (id) {
      case 'id-header':
        return 'id';
      case 'name-header':
        return 'name';
      case 'create-date-header':
        return 'createDate';
      case 'update-date-header':
        return 'updateDate';
    }
  }

  function sortArrayByProperty(arr, prop, dir) {
    const sortedArr = [...arr];
    return sortedArr.sort((a, b) => (!dir ? a[prop] < b[prop] : a[prop] > b[prop]) ? -1 : 1);
  }

  async function saveClientToDataBase(client) {
    const response = await fetch(`${url}/api/clients`, {
      method: 'POST',
      body: JSON.stringify(client),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const newClient = await response.json();
    return newClient;
  }

  async function getClientsFromDataBase() {
    const response = await fetch(`${url}/api/clients`);
    const clientsList = await response.json();
    return clientsList;
  }

  async function searchClientsInDataBase(filter) {
    const response = await fetch(`${url}/api/clients?search=${filter}`);
    const filteredClientsList = await response.json();
    return filteredClientsList;
  }

  function deleteClientFromDataBase(id) {
    fetch(`${url}/api/clients/${id}`, {
      method: 'DELETE',
    });
  }
});
