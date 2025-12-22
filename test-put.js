async function testPut() {
  const id = '69462cae1ea04747b2ce5f47';
  const url = `http://localhost:5001/horarios/${id}`;
  const body = { lugarAtencion: 'Aula 777' };

  console.log('PUT sin Authorization...');
  try {
    let res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    console.log('status', res.status);
    console.log('body', await res.text());
  } catch (e) { console.error('err', e); }

  console.log('\nPUT con Authorization (falso token)...');
  try {
    let res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer faketoken' }, body: JSON.stringify(body) });
    console.log('status', res.status);
    console.log('body', await res.text());
  } catch (e) { console.error('err', e); }
}

testPut();