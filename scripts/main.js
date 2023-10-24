const url = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  let clientsList = await getClientsFromDataBase();
  let tableViewClientsList = getViewClientsList(clientsList);

  prepareEvironment();
  renderClientsTable(tableViewClientsList);

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
      td.textContent = preprocessingData(key, value);
      tr.append(td);
    }

    const td = document.createElement('td');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    td.classList.add('table__cell');
    td.classList.add('table__cell_buttons');
    deleteButton.classList.add('btn');
    deleteButton.classList.add('btn-success');
    deleteButton.textContent = 'Изменить';
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
