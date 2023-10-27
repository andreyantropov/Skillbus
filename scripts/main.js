const url = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  let clientsList = await getClientsFromDataBase();
  let tableViewClientsList = getViewClientsList(clientsList);

  await prepareEvironment();
  renderClientsTable(tableViewClientsList);

  if (window.location.hash) {
    await showModalWindow(window.location.hash.substring(1));
  }

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
      removeHash();

      const clientsForm = document.getElementById('clients-form');
      clientsForm.reset();

      const contactsContainer = document.getElementById('contacts-container');
      contactsContainer.innerHTML = '';
    });

    addContactsOnClick();
    clientFormOnSubmit();

    const cancelButton = document.getElementById('modal-cancel-btn');
    cancelButton.addEventListener('click', async () => {
      const id = document.getElementById('id').value;
      if (!!id) await deleteClient(id);
      clientsModalInstance.hide();
    });
  }

  function addContactsOnClick() {
    const addContactBtn = document.getElementById('add-contact-btn');
    const contactsContainer = document.getElementById('contacts-container');
    addContactBtn.addEventListener('click', () => {
      contactsContainer.append( createContact() );
    });
  }

  function createContact(contact = { type: 'Телефон', value: '', }) {
    //https://getbootstrap.com/docs/5.0/forms/input-group/
    //https://getbootstrap.com/docs/5.0/components/dropdowns/
    const inputGroup = document.createElement('div');
    const dropdownBtn = document.createElement('button');
    const dropdownMenu = document.createElement('ul');
    const contactControl = document.createElement('input');
    const deleteBtn = document.createElement('button');
    const deleteIcon = document.createElement('img');

    inputGroup.classList.add('contact__input-group');
    inputGroup.classList.add('contact');
    inputGroup.classList.add('input-group');
    inputGroup.classList.add('mb-3');
    dropdownBtn.classList.add('contact__btn-dropdown');
    dropdownBtn.classList.add('btn');
    dropdownBtn.classList.add('btn-outline-secondary');
    dropdownBtn.classList.add('dropdown-toggle');
    dropdownBtn.type = 'button';
    dropdownBtn.ariaExpanded = 'false';
    dropdownBtn.dataset.bsToggle = 'dropdown';
    dropdownBtn.textContent = contact.type;
    dropdownMenu.classList.add('contact__dropdown');
    dropdownMenu.classList.add('dropdown-menu');
    contactControl.classList.add('form-control');
    contactControl.ariaLabel = 'Контакт пользователя';
    contactControl.placeholder = 'Введите данные контакта';
    contactControl.value = contact.value;
    contactControl.required = true;
    contactControl.type = getContactType(contact.type);
    deleteBtn.classList.add('contact__btn-delete');
    deleteBtn.classList.add('btn');
    deleteBtn.classList.add('btn-outline-secondary');
    deleteIcon.src = 'img/delete-contact.svg';
    deleteIcon.ariaHidden = true;

    const contactsTypes = ['Телефон', 'Доп. телефон', 'Email', 'VK', 'Facebook'];
    for (const type of contactsTypes) {
      const item = document.createElement('li');
      const link = document.createElement('a');

      link.classList.add('dropdown-item');
      link.href = '#';
      link.textContent = type;

      link.addEventListener('click', () => {
        dropdownBtn.textContent = link.textContent;
        contactControl.type = getContactType(link.textContent);
      });

      item.append(link);
      dropdownMenu.append(item);
    }

    deleteBtn.addEventListener('click', () => {
      inputGroup.remove();
    });

    deleteBtn.append(deleteIcon);
    inputGroup.append(dropdownBtn);
    inputGroup.append(dropdownMenu);
    inputGroup.append(contactControl);
    inputGroup.append(deleteBtn);

    return inputGroup;
  }

  function getContactType(type) {
    switch (type) {
      case 'Телефон':
        return 'tel';
      case 'Email':
        return 'email';
      default:
        return 'text';
    }
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
      const contactsElements = Array.from(document.getElementsByClassName('contact__input-group'));
      const contacts = contactsElements.map((contact) => ({ type: contact.querySelector('.dropdown-toggle').textContent, value: contact.querySelector('.form-control').value.trim(), }));

      const client = !id ? await saveClientToDataBase({ id: id, surname: lastName, name: firstName, lastName: secondName, contacts: contacts, }) : await updateClientInDataBase({ id: id, surname: lastName, name: firstName, lastName: secondName, contacts: contacts, });
      clientsList = await getClientsFromDataBase();
      tableViewClientsList = getViewClientsList(clientsList);

      clientsModalInstance.hide();
      renderClientsTable(tableViewClientsList);
    });
  }

  async function deleteClient(id) {
    if (!confirm('Вы уверены?')) return;
      await deleteClientFromDataBase(id);
      clientsList = await getClientsFromDataBase();
      tableViewClientsList = getViewClientsList(clientsList);
      renderClientsTable(tableViewClientsList);
  }

  async function addNewClientEvent() {
    const addButton = document.getElementById('add-client-btn');
    addButton.addEventListener('click', async () => {
      await showModalWindow();
    });
  }

  async function showModalWindow(id) {
    setHash(id);

    const clientsModal = document.getElementById('clients-modal-form');
    const clientsModalInstance = bootstrap.Modal.getInstance(clientsModal);
    clientsModalInstance.show();

    const title = document.getElementById('modal-title');
    const idSpan = document.getElementById('client-id-span');
    const cancelButton = document.getElementById('modal-cancel-btn');

    title.textContent = !id ? 'Новый клиент' : 'Изменить данные';
    idSpan.textContent = !id ? '' : `ID: ${id}`;
    cancelButton.textContent = !id ? 'Отмена' : 'Удалить клиента';

    await fillFormWithClientData(id);
  }

  async function fillFormWithClientData(id) {
    document.getElementById('id').value = '';

    if (!id) return;
    const client = await getClientByIdFromDataBase(id);
    document.getElementById('id').value = client.id;
    document.getElementById('last-name').value = client.surname;
    document.getElementById('first-name').value = client.name;
    document.getElementById('second-name').value = client.lastName;

    contactsContainer = document.getElementById('contacts-container');
    for (const contact of client.contacts) {
      contactsContainer.append( createContact(contact) );
    }
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
    return ({ id: client.id, name: `${client.surname} ${client.name} ${client.lastName}`, createDate: new Date(client.createdAt), updateDate: new Date(client.updatedAt), contacts: client.contacts, });
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
      if (key !== 'contacts') {
        td.textContent = value;
      } else {
        for (const contact of value) {
          td.classList.add('table__cell_contacts');
          const icon = document.createElement('img');
          icon.src = getContactIcon(contact.type);
          icon.alt = 'Контакт клиента';
          td.append(icon);
        }
      }
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
    deleteIcon.src = 'img/delete-client.svg';
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

  function getContactIcon(type) {
    switch (type) {
      case 'Телефон':
        return 'img/phone.svg';
      case 'Email':
        return 'img/email.svg';
      case 'VK':
        return 'img/vk.svg';
      case 'Facebook':
        return 'img/facebook.svg';
      default:
        return 'img/contact.svg';
    }
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

  async function deleteClientFromDataBase(id) {
    await fetch(`${url}/api/clients/${id}`, {
      method: 'DELETE',
    });
  }

  function setHash(hash) {
    window.location.hash = hash;
  }

  function removeHash() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }
});
