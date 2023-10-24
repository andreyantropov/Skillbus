const url = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  let clientsList = await getClientsFromDataBase();
  let tableViewClientsList = getViewClientsList(clientsList);

  prepareEvironment();
  renderClientsTable(tableViewClientsList);

  function prepareEvironment() {
    addClientsFormSubmitEvent();
  }

  function addClientsFormSubmitEvent() {
    const clientModal = document.getElementById('clients-modal-form');
    const clientsForm = document.getElementById('clients-form');
    clientsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('id').value;
      const lastName = document.getElementById('last-name').value.trim();
      const firstName = document.getElementById('first-name').value.trim();
      const secondName = document.getElementById('second-name').value.trim();

      const client = await saveClientToDataBase({ id: id, surname: lastName, name: firstName, lastName: secondName, contacts: [], });
      tableViewClientsList.push(clientMapper(client));

      clientsForm.reset();
      clientModal.dispose();
      renderClientsTable(tableViewClientsList);
    });
  }

  function getViewClientsList(clientsList) {
    return clientsList.map((client) => clientMapper(client));
  }

  function clientMapper(client) {
    return ({ id: client.id, name: `${client.surname} ${client.name} ${client.lastname}`, createDate: new Date(client.createdAt), updateDate: new Date(client.updatedAt), });
  }

  function renderClientsTable(clientsList) {
    const table = document.getElementById('clients-table');
    table.innerHTML = '';

    for (const client of clientsList) {
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
    td.classList.add('table__cell_buttons');
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
      tableViewClientsList = tableViewClientsList.filter((student) => student.id !== id);
      renderClientsTable(tableViewClientsList);
    });

    td.append(editButton);
    td.append(deleteButton);
    tr.append(td);

    return tr;
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

  function deleteClientFromDataBase(id) {
    fetch(`${url}/api/clients/${id}`, {
      method: 'DELETE',
    });
  }
});
