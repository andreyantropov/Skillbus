const url = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  let clientsList = await getClientsFromDataBase();
  let tableViewClientsList = getViewClientsList(clientsList);

  await prepareEvironment();
  renderClientsTable(tableViewClientsList);

  async function prepareEvironment() {
    createModalWindow();
    addNewClientEvent();
    addClientsFiltration();
    addTableSorting();
  }

  function createModalWindow() {
    const clientsModal = document.getElementById('clients-modal-form');
    const clientsModalInstance = new bootstrap.Modal(clientsModal, {});
    clientsModal.addEventListener('hidden.bs.modal', () => {
      const clientsForm = document.getElementById('clients-form');
      clientsForm.reset();
    });

    const cancelButton = document.getElementById('modal-cancel-btn');
    cancelButton.addEventListener('click', async () => {
      const id = document.getElementById('id').value;
      if (!!id) await deleteClient(id);
      clientsModalInstance.hide();
    });

    clientFormOnSubmit();
  }

  async function deleteClient(id) {
    if (!confirm('Вы уверены?')) return;
      deleteClientFromDataBase(id);
      clientsList = await getClientsFromDataBase();
      tableViewClientsList = getViewClientsList(clientsList);
      renderClientsTable(tableViewClientsList);
  }

  function clientFormOnSubmit() {
    const clientsForm = document.getElementById('clients-form');
    clientsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const clientsModal = document.getElementById('clients-modal-form');
      const clientsModalInstance = bootstrap.Modal.getInstance(clientsModal);

      const id = document.getElementById('id').value;
      const lastName = document.getElementById('last-name').value.trim();
      const firstName = document.getElementById('first-name').value.trim();
      const secondName = document.getElementById('second-name').value.trim();

      const client = !id ? await saveClientToDataBase({ id: id, surname: lastName, name: firstName, lastName: secondName, contacts: [], }) : await updateClientInDataBase({ id: id, surname: lastName, name: firstName, lastName: secondName, contacts: [], });
      clientsList = await getClientsFromDataBase();
      tableViewClientsList = getViewClientsList(clientsList);

      clientsModalInstance.hide();
      renderClientsTable(tableViewClientsList);
    });
  }

  async function addNewClientEvent() {
    const addButton = document.getElementById('add-client-btn');
    addButton.addEventListener('click', async () => {
      await showModalWindow();
    });
  }

  async function showModalWindow(id) {
    const clientsModal = document.getElementById('clients-modal-form');
    const clientsModalInstance = bootstrap.Modal.getInstance(clientsModal);
    clientsModalInstance.show();

    const title = document.getElementById('modal-title');
    const idSpan = document.getElementById('client-id-span');
    const cancelButton = document.getElementById('modal-cancel-btn');

    title.textContent = !id ? 'Новый клиент' : 'Изменить данные';
    idSpan.textContent = !id ? '' : `ID: ${id}`;
    cancelButton.textContent = !id ? 'Отмена' : 'Удалить клиента';

    fillFormWithClientData(id);
  }

  async function fillFormWithClientData(id) {
    if (!id) return;
    const client = await getClientByIdFromDataBase(id);
    document.getElementById('id').value = client.id;
    document.getElementById('last-name').value = client.surname;
    document.getElementById('first-name').value = client.name;
    document.getElementById('second-name').value = client.lastName;
  }

  function addTableSorting() {
    const tableHeaders = document.getElementsByClassName('table__header-title_sortable');
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
    const tableHeaders = document.getElementsByClassName('table__header-title_sortable');
    for (const tableHeader of tableHeaders) {
      tableHeader.classList.remove('sorted');
      tableHeader.classList.remove('sorted-reverse');
    }
  }

  function addClientsFiltration() {
    const filter = document.getElementById('filter');
    let inputTimeout = 0;
    filter.addEventListener('keyup', (e) => {
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(async () => {
        clientsList = !!e.target.value ? await searchClientsInDataBase(e.target.value) : await getClientsFromDataBase();
        tableViewClientsList = getViewClientsList(clientsList);
        renderClientsTable(tableViewClientsList);
      }, 300);
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
      const clientElement = await createClientElement(client);
      table.append(clientElement);
    }
  }

  async function createClientElement(client) {
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
    const editIcon = document.createElement('img');
    const deleteIcon = document.createElement('img');

    td.classList.add('table__cell');
    td.classList.add('table__cell_actions');
    editIcon.src = 'img/edit.svg';
    editIcon.ariaHidden = true;
    deleteIcon.src = 'img/delete.svg';
    deleteIcon.ariaHidden = true;
    editButton.classList.add('table__btn');
    editButton.classList.add('table__btn_edit');
    editButton.classList.add('btn');
    editButton.classList.add('btn-reset');
    editButton.textContent = 'Изменить';
    editButton.prepend(editIcon);
    deleteButton.classList.add('table__btn');
    deleteButton.classList.add('table__btn_delete');
    deleteButton.classList.add('btn');
    deleteButton.classList.add('btn-reset');
    deleteButton.textContent = 'Удалить';
    deleteButton.prepend(deleteIcon);

    editButton.addEventListener('click', async () => {
      await showModalWindow(client.id)
    });
    deleteButton.addEventListener('click', async () => {
      await deleteClient(client.id);
    });

    td.append(editButton);
    td.append(deleteButton);
    tr.append(td);

    return tr;
  }

  function sortClientsTable(clientsList) {
    let sortedClientsList = [...clientsList];
    const tableHeaders = document.getElementsByClassName('table__header-title_sortable');
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

  async function updateClientInDataBase(client) {
    const response = await fetch(`${url}/api/clients/${client.id}`, {
      method: 'PATCH',
      body: JSON.stringify(client),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const updatedClient = await response.json();
    return updatedClient;
  }

  async function getClientsFromDataBase() {
    const response = await fetch(`${url}/api/clients`);
    const clientsList = await response.json();
    return clientsList;
  }

  async function getClientByIdFromDataBase(id) {
    const response = await fetch(`${url}/api/clients/${id}`);
    const client = await response.json();
    return client;
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
